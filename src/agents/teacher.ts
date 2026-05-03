import { TeacherPlan } from "@/types/plan";
import { teacherPlanSchema } from "@/lib/schemas";
import {
  callGemini,
  extractFunctionCall,
  GeminiContent,
  GeminiTool,
} from "@/lib/llm";
import {
  DIFFICULTIES,
  FORCE_COLORS,
  FORCE_COLOR_LABELS_ZH,
  FORCE_TYPES,
  PROBLEM_TYPES,
  SHAPES,
  SUBJECTS,
} from "@/lib/constants";

// ─── System prompt: built from shared constants ──────────────────────────────

const colorGuidance = FORCE_TYPES.map(
  (t) => `${FORCE_COLOR_LABELS_ZH[t]}: "${FORCE_COLORS[t]}"`
).join("，");

const SYSTEM_PROMPT = `你是一位经验丰富的中国高中物理老师，专门分析初高中理科题目。

仔细阅读题目（文字或图片），调用 emit_plan 函数输出结构化的解题分析。
每道题恰好调用一次 emit_plan。

字段说明：
- subject: ${SUBJECTS.join(" / ")}
- problem_type: ${PROBLEM_TYPES.join(" / ")}
- difficulty: ${DIFFICULTIES.join(" / ")}
- objects[].shape: ${SHAPES.join(" / ")}
- forces[].type: ${FORCE_TYPES.join(" / ")}

坐标系约定：
- objects[].position 用 0-1 相对坐标，(0,0)=左上，(1,1)=右下
- forces[].angle_deg 从正 x 轴逆时针：0°=右，90°=上，180°=左，270°=下（重力）

颜色（forces[].color 推荐使用，与画面配色保持一致）：
${colorGuidance}

斜面题：斜面用 shape:"wedge"，滑块用 shape:"block"。
受力分析时合理排布物体在画面中的位置（避免居中重叠）。
mass 字段统一用字符串表示，例如 "10" 或 "10kg"。`;

// ─── Function-calling schema (Gemini OpenAPI subset) ─────────────────────────

const PLAN_TOOL: GeminiTool = {
  functionDeclarations: [
    {
      name: "emit_plan",
      description: "输出题目的结构化解题分析。每道题恰好调用一次。",
      parameters: {
        type: "OBJECT",
        properties: {
          problem_summary: { type: "STRING", description: "题目一句话描述" },
          subject: { type: "STRING", enum: [...SUBJECTS] },
          problem_type: { type: "STRING", enum: [...PROBLEM_TYPES] },
          difficulty: { type: "STRING", enum: [...DIFFICULTIES] },
          given: {
            type: "ARRAY",
            description:
              "已知量列表。每项为 { key: 符号, value: 带单位的数值 }",
            items: {
              type: "OBJECT",
              properties: {
                key: { type: "STRING" },
                value: { type: "STRING" },
              },
              required: ["key", "value"],
            },
          },
          unknowns: { type: "ARRAY", items: { type: "STRING" } },
          objects: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                mass: { type: "STRING" },
                label: { type: "STRING" },
                shape: { type: "STRING", enum: [...SHAPES] },
                position: {
                  type: "OBJECT",
                  properties: {
                    x: { type: "NUMBER", minimum: 0, maximum: 1 },
                    y: { type: "NUMBER", minimum: 0, maximum: 1 },
                  },
                  required: ["x", "y"],
                },
              },
              required: ["id", "label"],
            },
          },
          forces: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                on: {
                  type: "STRING",
                  description: "作用对象的 object id",
                },
                type: { type: "STRING", enum: [...FORCE_TYPES] },
                label: { type: "STRING", description: "符号，如 mg、N、f" },
                from: { type: "STRING" },
                magnitude: {
                  type: "STRING",
                  description: "表达式或数值",
                },
                angle_deg: { type: "NUMBER" },
                color: { type: "STRING", pattern: "^#[0-9A-Fa-f]{6}$" },
              },
              required: ["on", "type", "magnitude", "angle_deg"],
            },
          },
          solution_steps: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                step: { type: "INTEGER", minimum: 1 },
                description: { type: "STRING" },
                equation: { type: "STRING" },
                result: { type: "STRING" },
              },
              required: ["step", "description"],
            },
          },
          answer: { type: "STRING" },
        },
        required: [
          "problem_summary",
          "subject",
          "problem_type",
          "difficulty",
          "given",
          "objects",
          "forces",
          "solution_steps",
          "answer",
        ],
      },
    },
  ],
};

// ─── Image type detection ────────────────────────────────────────────────────

type SupportedMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function detectMediaType(base64: string): SupportedMedia {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("R0lGO")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface TeacherAgentOptions {
  signal?: AbortSignal;
}

export async function runTeacherAgent(
  problemText: string,
  imageBase64?: string,
  opts: TeacherAgentOptions = {}
): Promise<TeacherPlan> {
  const userContent: GeminiContent = { role: "user", parts: [] };

  if (imageBase64) {
    userContent.parts.push({
      inline_data: {
        mime_type: detectMediaType(imageBase64),
        data: imageBase64,
      },
    });
  }
  userContent.parts.push({
    text:
      problemText.trim() ||
      "请分析图片中的题目，调用 emit_plan 函数输出完整解题分析。",
  });

  const response = await callGemini(
    {
      contents: [userContent],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      tools: [PLAN_TOOL],
      toolConfig: {
        functionCallingConfig: {
          mode: "ANY",
          allowedFunctionNames: ["emit_plan"],
        },
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    { signal: opts.signal }
  );

  const call = extractFunctionCall(response);
  if (!call) {
    const cand = response.candidates?.[0];
    const finish = cand?.finishReason ?? "UNKNOWN";
    const textParts = (cand?.content?.parts ?? [])
      .map((p) => ("text" in p ? p.text : ""))
      .filter(Boolean)
      .join(" | ");
    console.error("[teacher] no functionCall. finishReason:", finish, "text:", textParts);
    throw new Error(
      `Gemini 没有调用 emit_plan 函数（finishReason=${finish}）${
        textParts ? `：${textParts.slice(0, 200)}` : ""
      }`
    );
  }

  // Convert array-of-pairs back to Record<string, string> for `given`
  const args = { ...call.args } as Record<string, unknown>;
  if (Array.isArray(args.given)) {
    const obj: Record<string, string> = {};
    for (const p of args.given as Array<{ key?: unknown; value?: unknown }>) {
      if (typeof p?.key === "string" && typeof p?.value === "string") {
        obj[p.key] = p.value;
      }
    }
    args.given = obj;
  }
  // Ensure unknowns is at least an empty array (it's optional per prompt)
  if (!Array.isArray(args.unknowns)) args.unknowns = [];

  const parsed = teacherPlanSchema.safeParse(args);
  if (!parsed.success) {
    console.error("[teacher] schema validation failed:", parsed.error.issues);
    throw new Error(
      `分析结果格式错误：${parsed.error.issues[0]?.message ?? "unknown"}`
    );
  }

  return parsed.data as TeacherPlan;
}
