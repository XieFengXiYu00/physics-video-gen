import { NextRequest, NextResponse } from "next/server";
import { SceneConfig, AnyScene } from "@/types/scene";

export async function POST(req: NextRequest) {
  try {
    const { sceneConfig } = (await req.json()) as { sceneConfig: SceneConfig };

    if (!sceneConfig?.scenes?.length) {
      return NextResponse.json({ error: "无效的场景配置" }, { status: 400 });
    }

    // Generate a simple PPTX-compatible XML (Office Open XML)
    const pptxBuffer = await generatePptx(sceneConfig);

    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="physics-slides.pptx"`,
      },
    });
  } catch (err) {
    console.error("[/api/export-pptx]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "导出失败" },
      { status: 500 }
    );
  }
}

async function generatePptx(config: SceneConfig): Promise<Buffer> {
  // Using pptxgenjs for PPTX generation
  // Dynamic import to avoid issues with server components
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.author = "Physics Video Generator";
  pptx.title = "解题分析";
  pptx.subject = "AI 生成的解题演示";

  for (const scene of config.scenes) {
    const slide = pptx.addSlide();
    slide.background = { color: "0f172a" };

    addSceneToSlide(slide, scene);
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return buffer as Buffer;
}

function addSceneToSlide(
  slide: ReturnType<InstanceType<typeof import("pptxgenjs").default>["addSlide"]>,
  scene: AnyScene
) {
  const titleStyle = {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: "22d3ee",
    fontFace: "Microsoft YaHei",
  } as const;

  const bodyStyle = {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 4,
    fontSize: 18,
    color: "e2e8f0",
    fontFace: "Microsoft YaHei",
    valign: "top" as const,
  };

  switch (scene.type) {
    case "problem":
      slide.addText(scene.title, titleStyle);
      slide.addText(scene.subtitle || "", {
        ...bodyStyle,
        y: 1.2,
        h: 0.5,
        fontSize: 14,
        color: "94a3b8",
      });
      if (scene.problemText) {
        slide.addText(scene.problemText, {
          ...bodyStyle,
          y: 1.8,
        });
      }
      break;

    case "diagram":
      slide.addText(scene.title, titleStyle);
      slide.addText("（受力分析图）", {
        ...bodyStyle,
        y: 2.5,
        fontSize: 16,
        color: "64748b",
      });
      if (scene.objects?.length) {
        const objList = scene.objects.map((o) => `• ${o.label}`).join("\n");
        slide.addText(`物体：\n${objList}`, {
          ...bodyStyle,
          y: 3.2,
          fontSize: 14,
        });
      }
      break;

    case "solution":
      slide.addText("解题步骤", titleStyle);
      if (scene.steps?.length) {
        const stepsText = scene.steps
          .map(
            (s) =>
              `${s.stepNumber}. ${s.description}${s.equation ? `\n   ${s.equation}` : ""}${s.result ? ` → ${s.result}` : ""}`
          )
          .join("\n\n");
        slide.addText(stepsText, bodyStyle);
      }
      break;

    case "storyboard":
      slide.addText(scene.title, titleStyle);
      slide.addText(scene.narration, {
        ...bodyStyle,
        fontSize: 20,
      });
      if (scene.equation) {
        slide.addText(scene.equation, {
          x: 0.5,
          y: 3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          color: "a78bfa",
          fontFace: "Consolas",
        });
      }
      if (scene.highlights?.length) {
        slide.addText(`关键点：${scene.highlights.join("、")}`, {
          x: 0.5,
          y: 4,
          w: 9,
          h: 0.5,
          fontSize: 16,
          color: "fbbf24",
          fontFace: "Microsoft YaHei",
        });
      }
      break;

    case "answer":
      slide.addText("答案", titleStyle);
      slide.addText(scene.answerText, {
        ...bodyStyle,
        y: 2,
        fontSize: 32,
        bold: true,
        color: "4ade80",
      });
      break;
  }
}
