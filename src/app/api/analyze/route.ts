import { NextRequest, NextResponse } from "next/server";
import { runTeacherAgent } from "@/agents/teacher";

export async function POST(req: NextRequest) {
  try {
    const { problemText, imageBase64 } = (await req.json()) as {
      problemText?: string;
      imageBase64?: string;
    };

    if (!problemText?.trim() && !imageBase64) {
      return NextResponse.json({ error: "请提供题目文字或图片" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "请在 .env.local（本地）或 Vercel 环境变量中配置 GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const plan = await runTeacherAgent(problemText ?? "", imageBase64);
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "分析失败" },
      { status: 500 }
    );
  }
}
