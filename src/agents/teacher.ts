import { TeacherPlan } from "@/types/plan";
import { teacherPlanSchema } from "@/lib/schemas";
import {
  callGemini,
  extractFunctionCall,
  extractModelText,
  GeminiContent,
  GeminiRequest,
  GeminiResponse,
  GeminiTool,
  getFinishReason,
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

const SYSTEM_PROMPT = `你是一位经验丰富、寓教于乐的中国中学理科老师。你的任务是将题目转化为精美的动态教学动画脚本。

══════════════════════════════════════════════════════════════════════════════
核心目标：生成【精美的动态动画视频脚本】
══════════════════════════════════════════════════════════════════════════════

你要输出的不只是答案，而是一段完整的、正在播放的教学视频分镜。
- 包含完整的推理过程，从头到尾把知识点讲清楚
- 页面极为精美、好看、有设计感，同时能准确传达知识
- 附带旁白式文字解说（narration），口语化、亲切、像老师在讲课
- 使用和谐好看的浅色配色方案，丰富的视觉元素
- 中英文双语字幕风格（narration 用中文，highlights 可中英混用）

【重要】视觉布局要求：
- 所有元素必须在 2K 分辨率画面中正确摆放
- 避免穿模、字幕遮挡、图形位置错误等影响视觉传达的问题
- 合理排布物体位置（避免居中重叠），使用 0-1 相对坐标

══════════════════════════════════════════════════════════════════════════════
参考答案处理规则（极其重要）
══════════════════════════════════════════════════════════════════════════════

【务必重视参考答案】当用户提供了参考答案时：
1. 以参考答案为最终结论进行逆向推理，确保你的解题过程能推导出该答案
2. 结合参考答案和题目一起深入思考，理解出题人意图
3. 如果参考答案与你的初步理解有冲突，优先信任参考答案并调整推理
4. 在 visual_storyboard 中清晰展示如何一步步得到参考答案
5. answer 字段必须与参考答案一致

══════════════════════════════════════════════════════════════════════════════
输出格式要求
══════════════════════════════════════════════════════════════════════════════

仔细阅读题目（文字或图片），调用 emit_plan 函数输出结构化的解题分析。
每道题恰好调用一次 emit_plan。

字段说明：
- subject: ${SUBJECTS.join(" / ")}
- problem_type: ${PROBLEM_TYPES.join(" / ")}
- difficulty: ${DIFFICULTIES.join(" / ")}
- objects[].shape: ${SHAPES.join(" / ")}
- forces[].type: ${FORCE_TYPES.join(" / ")}
- visual_storyboard: 适合 Remotion 动画的视频分镜（4-7 步）

坐标系约定：
- objects[].position 用 0-1 相对坐标，(0,0)=左上，(1,1)=右下
- forces[].angle_deg 从正 x 轴逆时针：0°=右，90°=上，180°=左，270°=下（重力）

颜色（forces[].color 推荐使用，与画面配色保持一致）：
${colorGuidance}

斜面题：斜面用 shape:"wedge"，滑块用 shape:"block"。
mass 字段统一用字符串表示，例如 "10" 或 "10kg"。

══════════════════════════════════════════════════════════════════════════════
visual_storyboard 分镜脚本要求
══════════════════════════════════════════════════════════════════════════════

- 输出 4-7 步，适合逐屏播放和字幕旁白
- 每步 narration 用口语化中文，像老师在讲课，解释"为什么这么做"
- visual_action 只能使用：show_items / show_equation / distribute_items / compare_cases / highlight_answer / explain
- 数学、组合、分配类题目优先表达"展示对象 → 列式 → 尝试或排除 → 构造方案 → 高亮答案"
- groups 用于表达分组/分配，例如 [{"label":"同学A","items":["10元","5元"],"sum":"15元"}]
- highlights 用于强调关键数字、结论或关键词（支持中英混用）

【分镜质量标准】
- 每一帧都要有清晰的视觉焦点
- 信息密度适中，不要一帧塞太多内容
- 前后帧之间要有逻辑递进关系
- 最后一帧必须是 highlight_answer，清晰呈现最终答案`;

/** Same constraints as emit_plan，但要求纯 JSON（用于工具调用失败时的回退）。 */
const SYSTEM_PROMPT_JSON = `${SYSTEM_PROMPT}

【本轮输出】不要使用函数调用。请直接输出唯一一个 JSON 对象（UTF-8），顶层字段名与 emit_plan 参数一致：
problem_summary, subject, problem_type, difficulty, given, unknowns, objects, forces, solution_steps, visual_storyboard, answer。
given 必须是对象：键为已知量符号（字符串），值为带单位的数值字符串。
不要输出 markdown 代码围栏或其它说明文字。`;

// ─── Function-calling schema (Gemini OpenAPI subset) ─────────────────────────
// 注意：不要在 schema 里使用 pattern 等复杂约束，否则容易触发 MALFORMED_FUNCTION_CALL。

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
                color: {
                  type: "STRING",
                  description:
                    "可选；十六进制颜色，例如 #E53935 或 #ff5722",
                },
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
          visual_storyboard: {
            type: "ARRAY",
            description:
              "面向 Remotion 短视频的分镜脚本。每步都是一屏动画的意图和旁白。",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "分镜标题" },
                narration: {
                  type: "STRING",
                  description: "适合字幕/旁白的中文讲解，一到两句话",
                },
                visual_action: {
                  type: "STRING",
                  enum: [
                    "show_items",
                    "show_equation",
                    "distribute_items",
                    "compare_cases",
                    "highlight_answer",
                    "explain",
                  ],
                },
                equation: {
                  type: "STRING",
                  description: "本屏需要展示的公式、算式或关键等式",
                },
                highlights: {
                  type: "ARRAY",
                  description: "画面上需要突出显示的关键词或数字",
                  items: { type: "STRING" },
                },
                groups: {
                  type: "ARRAY",
                  description:
                    "分组/分配动画数据，例如每位同学拿到哪些车票和总和",
                  items: {
                    type: "OBJECT",
                    properties: {
                      label: { type: "STRING" },
                      items: { type: "ARRAY", items: { type: "STRING" } },
                      sum: { type: "STRING" },
                    },
                    required: ["label", "items"],
                  },
                },
              },
              required: ["title", "narration", "visual_action"],
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

const JSON_USER_SUFFIX = `\n\n【本轮】不要调用函数。仅输出一个 JSON 对象，字段与系统说明一致；given 为对象。`;

// ─── Image type detection ────────────────────────────────────────────────────

type SupportedMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function detectMediaType(base64: string): SupportedMedia {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("R0lGO")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

// ─── Args normalization & validation ─────────────────────────────────────────

function normalizeRawArgs(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  if (Array.isArray(out.given)) {
    const obj: Record<string, string> = {};
    for (const p of out.given as Array<{ key?: unknown; value?: unknown }>) {
      if (typeof p?.key === "string" && typeof p?.value === "string") {
        obj[p.key] = p.value;
      }
    }
    out.given = obj;
  } else if (out.given && typeof out.given === "object" && !Array.isArray(out.given)) {
    const g = out.given as Record<string, unknown>;
    const fixed: Record<string, string> = {};
    for (const [k, v] of Object.entries(g)) {
      fixed[k] = typeof v === "string" ? v : String(v ?? "");
    }
    out.given = fixed;
  }
  if (!Array.isArray(out.unknowns)) out.unknowns = [];
  return out;
}

function tryParsePlanFromResponse(res: GeminiResponse): TeacherPlan | null {
  const call = extractFunctionCall(res);
  if (!call || call.name !== "emit_plan") return null;
  const normalized = normalizeRawArgs(call.args as Record<string, unknown>);
  const parsed = teacherPlanSchema.safeParse(normalized);
  if (!parsed.success) {
    console.warn("[teacher] tool args failed zod:", parsed.error.issues);
    return null;
  }
  return parsed.data as TeacherPlan;
}

function buildToolRequest(
  userContent: GeminiContent,
  temperature: number
): GeminiRequest {
  return {
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
      temperature,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
}

function appendToLastUserText(content: GeminiContent, suffix: string): GeminiContent {
  const parts = content.parts.map((p) => ({ ...p })) as GeminiContent["parts"];
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if ("text" in p && typeof p.text === "string") {
      parts[i] = { text: p.text + suffix };
      break;
    }
  }
  return { role: "user", parts };
}

function stripMarkdownJsonFence(s: string): string {
  let t = s.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)```$/im.exec(t);
  if (m) t = m[1].trim();
  return t;
}

async function runTeacherPlanJsonFallback(
  userContent: GeminiContent,
  opts: TeacherAgentOptions
): Promise<TeacherPlan> {
  const uc = appendToLastUserText(userContent, JSON_USER_SUFFIX);
  const response = await callGemini(
    {
      contents: [uc],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_JSON }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
      },
    },
    opts
  );

  const rawText = extractModelText(response);
  const stripped = stripMarkdownJsonFence(rawText);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripped);
  } catch (e) {
    throw new Error(
      `JSON 回退解析失败：${e instanceof Error ? e.message : String(e)}（前 400 字：${rawText.slice(0, 400)}）`
    );
  }

  const normalized = normalizeRawArgs(parsedJson as Record<string, unknown>);
  const parsed = teacherPlanSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(
      `JSON 回退校验失败：${parsed.error.issues[0]?.message ?? parsed.error.message}`
    );
  }
  return parsed.data as TeacherPlan;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface TeacherAgentOptions {
  signal?: AbortSignal;
}

export async function runTeacherAgent(
  problemText: string,
  imageBase64?: string,
  referenceAnswer?: string,
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

  let userText =
    problemText.trim() ||
    "请分析图片中的题目，调用 emit_plan 函数输出完整解题分析。";

  if (referenceAnswer?.trim()) {
    userText += `\n\n【参考答案】${referenceAnswer.trim()}\n请根据上述参考答案，推导完整的解题过程和视频分镜。`;
  }

  userContent.parts.push({ text: userText });

  let response = await callGemini(buildToolRequest(userContent, 0.2), opts);
  let plan = tryParsePlanFromResponse(response);
  if (plan) return plan;

  const fr1 = getFinishReason(response);
  console.warn("[teacher] first tool attempt failed, retrying (temp=0)", fr1);

  response = await callGemini(buildToolRequest(userContent, 0), opts);
  plan = tryParsePlanFromResponse(response);
  if (plan) return plan;

  const fr2 = getFinishReason(response);
  console.warn("[teacher] tool path failed, JSON fallback", fr1, fr2);

  try {
    return await runTeacherPlanJsonFallback(userContent, opts);
  } catch (fallbackErr) {
    const textHint = extractModelText(response).slice(0, 200);
    throw new Error(
      `Gemini 未能产出有效解题计划（finishReason=${fr2 ?? fr1 ?? "UNKNOWN"}）。` +
        (fallbackErr instanceof Error ? ` ${fallbackErr.message}` : "") +
        (textHint ? ` 片段：${textHint}` : "")
    );
  }
}
