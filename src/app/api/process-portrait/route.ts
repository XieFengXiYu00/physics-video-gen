/**
 * 人像处理 API：去除背景，返回透明 PNG。
 *
 * 输入: { image: "data:image/jpeg;base64,..." | "<base64>" }
 * 输出: { dataUrl: "data:image/png;base64,..." }
 *
 * 实现: 通过 @remove-background-ai/rembg.js 调用 rembg.com API。
 * 需要在环境变量中配置 REMBG_API_KEY。
 */

import { NextRequest, NextResponse } from "next/server";
import { rembg } from "@remove-background-ai/rembg.js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

function stripDataUrl(input: string): { base64: string; mime: string } {
  const m = input.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (m) return { mime: m[1], base64: m[2] };
  // 假设是纯 base64
  return { mime: "image/jpeg", base64: input };
}

function normalizeDataUrl(base64Image: string): string {
  return base64Image.startsWith("data:")
    ? base64Image
    : `data:image/png;base64,${base64Image}`;
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

    const apiKey = process.env.REMBG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "请配置 REMBG_API_KEY 环境变量" },
        { status: 500 }
      );
    }

    const { base64 } = stripDataUrl(image);
    const buf = Buffer.from(base64, "base64");
    if (buf.length === 0) {
      return NextResponse.json({ error: "image 解码失败" }, { status: 400 });
    }
    if (buf.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "图片过大（>8MB）" }, { status: 400 });
    }

    const { base64Image } = await rembg({
      apiKey,
      inputImage: { base64 },
      onUploadProgress: () => {},
      onDownloadProgress: () => {},
      options: {
        returnBase64: true,
        format: "png",
        w: 0,
        h: 0,
      },
    });

    if (!base64Image) {
      throw new Error("rembg API 未返回处理后的图片");
    }

    const dataUrl = normalizeDataUrl(base64Image);
    const outputBase64 = dataUrl.split(",")[1] ?? "";
    return NextResponse.json({
      dataUrl,
      bytes: Buffer.byteLength(outputBase64, "base64"),
    });
  } catch (err) {
    console.error("[/api/process-portrait]", err);
    const message = err instanceof Error ? err.message : "处理失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
