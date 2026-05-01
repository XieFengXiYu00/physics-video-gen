import { NextRequest, NextResponse } from "next/server";
import { runVideoPlanner } from "@/agents/videoPlanner";
import { TeacherPlan } from "@/types/plan";

export async function POST(req: NextRequest) {
  try {
    const { plan } = (await req.json()) as { plan: TeacherPlan };

    if (!plan) {
      return NextResponse.json({ error: "缺少 plan 数据" }, { status: 400 });
    }

    const sceneConfig = runVideoPlanner(plan);
    return NextResponse.json({ sceneConfig });
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成失败" },
      { status: 500 }
    );
  }
}
