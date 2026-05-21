/**
 * 人像处理 API：去除背景，返回透明 PNG。
 *
 * 输入: { image: "data:image/jpeg;base64,..." | "<base64>" }
 * 输出: { dataUrl: "data:image/png;base64,..." }
 *
 * 实现: 通过 child_process.spawn 调用 scripts/process_portrait.py（rembg）。
 * 容器中需要安装 Python + rembg（参见 Dockerfile）。
 */

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCRIPT_PATH = "scripts/process_portrait.py";

function stripDataUrl(input: string): { base64: string; mime: string } {
  const m = input.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (m) return { mime: m[1], base64: m[2] };
  // 假设是纯 base64
  return { mime: "image/jpeg", base64: input };
}

function runPython(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", args, {
      cwd,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    let stderr = "";
    proc.stdout.on("data", (d) => process.stdout.write(d));
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      process.stderr.write(d);
    });
    proc.on("close", (code) => {
      if (code === 0) resolve("");
      else reject(new Error(`python exited with ${code}: ${stderr}`));
    });
    proc.on("error", reject);
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "今日使用次数已达上限，请明天再试" },
        { status: 429 }
      );
    }

    const { image } = (await req.json()) as { image?: string };
    if (!image) {
      return NextResponse.json({ error: "缺少 image 字段" }, { status: 400 });
    }

    const { base64 } = stripDataUrl(image);
    const buf = Buffer.from(base64, "base64");
    if (buf.length === 0) {
      return NextResponse.json({ error: "image 解码失败" }, { status: 400 });
    }
    if (buf.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "图片过大（>8MB）" }, { status: 400 });
    }

    const workDir = await mkdtemp(join(tmpdir(), "portrait-"));
    const inputPath = join(workDir, "in.jpg");
    const outputPath = join(workDir, "out.png");

    try {
      await writeFile(inputPath, buf);
      await runPython(
        [SCRIPT_PATH, inputPath, outputPath, "--model", "u2netp"],
        process.cwd()
      );
      const result = await readFile(outputPath);
      const dataUrl = `data:image/png;base64,${result.toString("base64")}`;
      return NextResponse.json({ dataUrl, bytes: result.length });
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (err) {
    console.error("[/api/process-portrait]", err);
    const message = err instanceof Error ? err.message : "处理失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
