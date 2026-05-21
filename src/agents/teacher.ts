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

const SYSTEM_PROMPT = `你是一位专业的 Remotion 视频脚本创作者，擅长把任意内容转化为节奏流畅、视觉精美的动态视频分镜脚本。

你既可以制作「教学解题」类视频，也可以制作「品牌介绍」「产品展示」「技术开场白」「动效模板」等创意内容——就像 Remotion 官网的精美展示视频。

【创作原则】
- 始终从「这一帧观众看到什么、感受什么」出发设计分镜
- 每一屏有清晰的视觉焦点，信息密度适中，不要一帧塞太多内容
- narration 根据风格调整：教学口吻、产品文案、技术解说、旁白叙述均可
- 配色、布局、节奏参考 Remotion 官网美学：简洁现代，重视留白，动效克制有力
- highlights 中英混用，用于字幕强调和视觉标签
- 前后帧逻辑递进：「吸引注意 → 展开内容 → 强调结论」

【视觉布局要求】
- 所有元素在画面中合理摆放（画布默认 1920×1080），使用 0-1 相对坐标
- 背景、文字、图形层次分明，避免穿模和字幕遮挡

══════════════════════════════════════════════════════════════════════════════
教学解题模式：参考答案处理规则
══════════════════════════════════════════════════════════════════════════════

当用户提供了参考答案时：
1. 以参考答案为最终结论进行逆向推理，确保解题过程能推导出该答案
2. solution_steps 只保留最终正确路径，不要输出自相矛盾步骤
3. visual_storyboard 围绕最终正确方案组织镜头
4. answer 字段与参考答案一致

══════════════════════════════════════════════════════════════════════════════
输出格式要求
══════════════════════════════════════════════════════════════════════════════

调用 emit_plan 函数，每次请求恰好调用一次。

字段说明：
- subject: ${SUBJECTS.join(" / ")}（非教学类选 other）
- problem_type: ${PROBLEM_TYPES.join(" / ")}（创意视频可选 other）
- difficulty: ${DIFFICULTIES.join(" / ")}
- objects[].shape: ${SHAPES.join(" / ")}
- forces[].type: ${FORCE_TYPES.join(" / ")}
- objects 和 forces：教学物理题必填；创意视频类可为空数组
- visual_storyboard: 分镜脚本 3-8 步，每步是可直接渲染的一屏画面

坐标系约定（教学题专用）：
- objects[].position 用 0-1 相对坐标，(0,0)=左上，(1,1)=右下
- forces[].angle_deg 从正 x 轴逆时针：0°=右，90°=上，180°=左，270°=下（重力）

颜色参考（forces[].color）：
${colorGuidance}

══════════════════════════════════════════════════════════════════════════════
visual_storyboard 分镜脚本要求
══════════════════════════════════════════════════════════════════════════════

输出 3-8 步，每步是「可直接渲染的一屏」。layout_type 选择渲染模板：

  教学类      equation_focus / constraint_reasoning / final_answer_reveal / ticket_pool / student_distribution
  创意展示类  hero_title / feature_highlight / split_screen / text_reveal / stats_counter / timeline_step / code_showcase / logo_reveal
  通用兜底    default

- visual_action: show_items / show_equation / distribute_items / compare_cases / highlight_answer / explain / reveal_text / animate_logo / count_stats
- visual_priority: objects / equation / constraints / answer / text / graphic
- panel_style: glass / flat / spotlight / board / gradient / dark
- animation_cue: stagger_in / count_up / spotlight / distribute / reveal_answer / slide_in / zoom_in / typewriter
- caption_style: bilingual / teacher / minimal / marketing
- highlights 用于强调关键词；groups 用于分组/分配动画

【分镜质量标准】
- 每帧视觉焦点清晰，节奏稳定，前后递进
- 教学类：solution_steps 3-6 步，只保留正确解法主线；最后一帧 highlight_answer
- 创意类：第一帧「抓眼球」的视觉冲击；末帧品牌/结论强印象（logo_reveal 或 highlight_answer）`;

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
      description: "输出视频脚本的结构化分析。每次请求恰好调用一次。",
      parameters: {
        type: "OBJECT",
        properties: {
          problem_summary: { type: "STRING", description: "视频内容一句话概述" },
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
                    "reveal_text",
                    "animate_logo",
                    "count_stats",
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
                layout_type: {
                  type: "STRING",
                  enum: [
                    // 教学类
                    "equation_focus",
                    "constraint_reasoning",
                    "final_answer_reveal",
                    "ticket_pool",
                    "student_distribution",
                    // 创意展示类
                    "hero_title",
                    "feature_highlight",
                    "split_screen",
                    "text_reveal",
                    "stats_counter",
                    "timeline_step",
                    "code_showcase",
                    "logo_reveal",
                    // 通用
                    "default",
                  ],
                },
                visual_priority: {
                  type: "STRING",
                  enum: ["objects", "equation", "constraints", "answer", "text", "graphic"],
                },
                entity_positions: {
                  type: "ARRAY",
                  description: "关键视觉实体在画面中的位置与强调信息",
                  items: {
                    type: "OBJECT",
                    properties: {
                      id: { type: "STRING" },
                      label: { type: "STRING" },
                      x: { type: "NUMBER", minimum: 0, maximum: 1 },
                      y: { type: "NUMBER", minimum: 0, maximum: 1 },
                      kind: {
                        type: "STRING",
                        enum: ["ticket", "student", "equation", "constraint", "answer", "object"],
                      },
                      emphasis: { type: "BOOLEAN" },
                      value: { type: "STRING" },
                    },
                    required: ["id", "label", "x", "y"],
                  },
                },
                panel_style: {
                  type: "STRING",
                  enum: ["glass", "flat", "spotlight", "board", "gradient", "dark"],
                },
                emphasis_target: {
                  type: "STRING",
                  description: "本屏最重要的对象、变量或结论",
                },
                animation_cue: {
                  type: "STRING",
                  enum: ["stagger_in", "count_up", "spotlight", "distribute", "reveal_answer", "slide_in", "zoom_in", "typewriter"],
                },
                step_duration: {
                  type: "INTEGER",
                  description: "建议时长，单位 frame，范围 60-240",
                },
                caption_style: {
                  type: "STRING",
                  enum: ["bilingual", "teacher", "minimal", "marketing"],
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
              required: [
                "title",
                "narration",
                "visual_action",
                "layout_type",
                "visual_priority",
                "entity_positions",
                "panel_style",
                "emphasis_target",
                "animation_cue",
                "step_duration",
                "caption_style",
                "highlights",
              ],
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
          "visual_storyboard",
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
