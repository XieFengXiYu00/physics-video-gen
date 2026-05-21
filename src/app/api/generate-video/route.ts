import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractModelText, callDeepSeek } from "@/lib/llm";
import { TEMPLATES, getTemplate, type TemplateInfo } from "@/lib/templates";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  getFreeformTotalFrames,
  type FreeformScene,
} from "@/remotion/FreeformSceneScript.types";

type Provider = "gemini" | "deepseek";

/**
 * ────────────────────────────────────────────────────────────────────
 * 内容长度判定
 * ────────────────────────────────────────────────────────────────────
 * 单屏品牌模板（NeonTitle / SplitBrandIntro / ...）字段都很小（2-25 字）。
 * 一旦用户输入超过下面任一阈值，单纯塞进品牌模板必然丢词，因此服务端
 * 会自动走 CompositeVideo 复合分支：用所选品牌模板做片头，剩下的内容
 * 用 FreeformSceneScript 多场景展开。
 */
function isLongInput(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length >= 50) return true;
  if (trimmed.includes("\n")) return true;
  const sentenceEnders = trimmed.match(/[。！？\.!?；;]/g);
  if (sentenceEnders && sentenceEnders.length >= 2) return true;
  return false;
}

/** 单屏品牌模板：只适合短词/标题，长输入会丢词，需要走复合视频分支。 */
const BRAND_TEMPLATES = new Set<string>([
  "SplitBrandIntro",
  "JensenHuangCeoIntro",
  "GlitchHtmlCanvasSample",
  "TypewriterText",
  "CountdownTimer",
  "NeonTitle",
  "MinimalQuote",
  "ParticleWaveTitle",
  "LogoBrandReveal",
]);

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "今日使用次数已达上限（每天 4 次），请明天再试" },
        { status: 429 }
      );
    }

    const { prompt, templateId, colorScheme, dimensions, provider } = (await req.json()) as {
      prompt?: string;
      templateId?: string;
      colorScheme?: { accent: string; background: string };
      dimensions?: { width: number; height: number };
      provider?: Provider;
    };
    const activeProvider: Provider = provider === "deepseek" ? "deepseek" : "gemini";

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
    }

    if (activeProvider === "gemini" && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "请配置 GEMINI_API_KEY 环境变量" }, { status: 500 });
    }
    if (activeProvider === "deepseek" && !process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: "请配置 DEEPSEEK_API_KEY 环境变量" }, { status: 500 });
    }

    const requestedTemplate = templateId ? getTemplate(templateId) : undefined;

    // ────────────────────────────────────────────────────────────────
    // 关键判定：长输入 + 单屏品牌模板 → CompositeVideo 复合视频
    // 让 LLM 同时输出 intro.props（给所选品牌模板做片头）+ scenes（展开正文）。
    // ────────────────────────────────────────────────────────────────
    const willCompose =
      !!requestedTemplate &&
      BRAND_TEMPLATES.has(requestedTemplate.id) &&
      isLongInput(prompt);

    if (willCompose && requestedTemplate) {
      return await handleComposite({
        introTemplate: requestedTemplate,
        colorScheme,
        dimensions,
        userPrompt: prompt,
        activeProvider,
      });
    }

    // ────────────────────────────────────────────────────────────────
    // 普通分支：单模板（用户选定品牌模板且输入短；或 Freeform；或自动选）
    // ────────────────────────────────────────────────────────────────
    let chosenTemplate = requestedTemplate;

    const templateListStr = TEMPLATES.map(
      (t) => `- id: "${t.id}"  名称: ${t.labelZh}  说明: ${t.descZh}`
    ).join("\n");

    const systemPrompt = chosenTemplate
      ? buildPropsPrompt(chosenTemplate.id, chosenTemplate.propsSchema, colorScheme, prompt)
      : buildAutoSelectPrompt(templateListStr, colorScheme, prompt);

    const raw = await callLLM(activeProvider, systemPrompt, prompt);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "LLM 返回了无效的 JSON", raw },
        { status: 500 }
      );
    }

    let finalTemplateId: string;
    let templateProps: Record<string, unknown>;

    if (chosenTemplate) {
      finalTemplateId = chosenTemplate.id;
      const { durationSeconds: _d, ...restProps } = parsed;
      templateProps = restProps;
    } else {
      finalTemplateId = parsed.templateId as string;
      templateProps = parsed.props as Record<string, unknown>;
      chosenTemplate = getTemplate(finalTemplateId);
      if (!chosenTemplate) {
        chosenTemplate = TEMPLATES[0];
        finalTemplateId = chosenTemplate.id;
      }
    }

    // ────────────────────────────────────────────────────────────────
    // 时长计算
    // ────────────────────────────────────────────────────────────────
    const fps = chosenTemplate.fps;
    let finalDurationFrames: number;

    if (finalTemplateId === "FreeformSceneScript") {
      const rawScenes = (templateProps?.scenes ?? []) as FreeformScene[];
      const scenes = Array.isArray(rawScenes) ? rawScenes : [];
      if (scenes.length === 0) {
        try {
          const def = JSON.parse(chosenTemplate.defaultProps);
          templateProps = { ...templateProps, scenes: def.scenes };
          finalDurationFrames = getFreeformTotalFrames(def.scenes);
        } catch {
          finalDurationFrames = 600;
        }
      } else {
        finalDurationFrames = getFreeformTotalFrames(scenes);
        if (finalDurationFrames < 90 || finalDurationFrames > 30 * 90) {
          finalDurationFrames = Math.max(90, Math.min(30 * 90, finalDurationFrames));
        }
      }
    } else {
      // 单屏品牌模板：固定用模板默认时长，避免后半段静止
      finalDurationFrames = chosenTemplate.durationFrames;
    }

    return NextResponse.json({
      templateId: finalTemplateId,
      templateProps,
      durationFrames: finalDurationFrames,
      fps,
      width: dimensions?.width ?? chosenTemplate.width,
      height: dimensions?.height ?? chosenTemplate.height,
    });
  } catch (err) {
    console.error("[/api/generate-video]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成失败" },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════════════════════════════
// 复合视频分支：品牌片头 + Freeform 多场景
// ════════════════════════════════════════════════════════════════════

async function handleComposite(args: {
  introTemplate: TemplateInfo;
  colorScheme?: { accent: string; background: string };
  dimensions?: { width: number; height: number };
  userPrompt: string;
  activeProvider: Provider;
}) {
  const { introTemplate, colorScheme, dimensions, userPrompt, activeProvider } = args;

  // 继承色：用户向导选的 > 品牌模板默认色
  let inheritedColor: { accent: string; background: string } | undefined;
  if (!colorScheme) {
    try {
      const def = JSON.parse(introTemplate.defaultProps) as Record<string, string>;
      if (def.accentColor && def.backgroundColor) {
        inheritedColor = { accent: def.accentColor, background: def.backgroundColor };
      }
    } catch {
      // ignore
    }
  }
  const effectiveColor = colorScheme ?? inheritedColor;

  const systemPrompt = buildCompositePrompt(
    introTemplate.id,
    introTemplate.propsSchema,
    effectiveColor,
    userPrompt
  );

  const raw = await callLLM(activeProvider, systemPrompt, userPrompt);
  let parsed: {
    intro?: Record<string, unknown>;
    scenes?: unknown;
    accentColor?: string;
    backgroundColor?: string;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "LLM 返回了无效的 JSON（复合视频）", raw },
      { status: 500 }
    );
  }

  // 提取 intro props（兼容 LLM 把字段直接放在 intro 下、或包一层 props）
  const introBlock = (parsed.intro ?? {}) as Record<string, unknown>;
  const introPropsRaw =
    (introBlock.props as Record<string, unknown> | undefined) ?? introBlock;
  const introProps: Record<string, unknown> = { ...introPropsRaw };

  // 解析 scenes
  const scenesRaw = parsed.scenes;
  let scenes: FreeformScene[] = Array.isArray(scenesRaw)
    ? (scenesRaw as FreeformScene[])
    : [];
  if (scenes.length === 0) {
    // 兜底：用 Freeform 默认 scenes，保证视频后段有内容
    try {
      const freeformTemplate = getTemplate("FreeformSceneScript");
      if (freeformTemplate) {
        const def = JSON.parse(freeformTemplate.defaultProps) as {
          scenes: FreeformScene[];
        };
        scenes = def.scenes;
      }
    } catch {
      // ignore
    }
  }

  // 解析颜色 — 用户向导选的 > LLM 返回的 > introProps 里的 > 继承的品牌色
  const accentColor =
    effectiveColor?.accent ??
    parsed.accentColor ??
    (introProps.accentColor as string | undefined) ??
    "#f39200";
  const backgroundColor =
    effectiveColor?.background ??
    parsed.backgroundColor ??
    (introProps.backgroundColor as string | undefined) ??
    "#0a0a0a";

  // 强制覆盖 introProps 的颜色 → 与整体复合视频色系一致
  introProps.accentColor = accentColor;
  introProps.backgroundColor = backgroundColor;

  const introDurationFrames = introTemplate.durationFrames;
  const bodyFrames = getFreeformTotalFrames(scenes);
  const totalDuration = introDurationFrames + bodyFrames;

  console.log(
    "[generate-video] COMPOSITE:",
    introTemplate.id,
    `(${introDurationFrames}f) +`,
    `${scenes.length} scenes (${bodyFrames}f) =`,
    `${totalDuration}f`
  );

  return NextResponse.json({
    templateId: "CompositeVideo",
    templateProps: {
      introTemplateId: introTemplate.id,
      introProps,
      introDurationFrames,
      scenes,
      accentColor,
      backgroundColor,
    },
    durationFrames: totalDuration,
    fps: introTemplate.fps,
    // 复合视频统一用 1920x1080（除非用户向导选了其它比例）；
    // 因为各品牌模板默认 1280x720 但 Freeform 部分在 1920x1080 视觉更舒服。
    width: dimensions?.width ?? Math.max(introTemplate.width, 1920),
    height: dimensions?.height ?? Math.max(introTemplate.height, 1080),
    composedFrom: introTemplate.id,
  });
}

// ════════════════════════════════════════════════════════════════════
// LLM 调用统一封装
// ════════════════════════════════════════════════════════════════════

const MAX_TOKENS = 4096;

async function callLLM(
  provider: Provider,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (provider === "deepseek") {
    const raw = await callDeepSeek({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: MAX_TOKENS,
      jsonMode: true,
    });
    return raw.trim();
  }
  const res = await callGemini({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: MAX_TOKENS,
      responseMimeType: "application/json",
    },
  });
  return extractModelText(res).trim();
}

// ════════════════════════════════════════════════════════════════════
// Prompt 构造
// ════════════════════════════════════════════════════════════════════

function buildPropsPrompt(
  templateId: string,
  propsSchema: string,
  colorScheme: { accent: string; background: string } | undefined,
  userPrompt: string
): string {
  const colorHint = colorScheme
    ? `

## ⚠️ 强制配色约束（最高优先级）
- **accentColor 必须设为**：${colorScheme.accent}
- **backgroundColor 必须设为**：${colorScheme.background}
这是硬性要求。所有色系相关的字段都要使用以上配色或派生色。`
    : "";

  if (templateId === "FreeformSceneScript") {
    return buildFreeformPrompt(propsSchema, colorScheme, userPrompt);
  }

  return `你是一名视频内容编辑。你的任务是：将用户输入的内容**完整地**重新分配到模板 "${templateId}" 的展示区域。

## 模板展示区域（props schema）
${propsSchema}${colorHint}

## 内容编辑原则（按优先级）
1. **优先级最高 — 完整保留**：用户输入的所有实词（品牌名、产品名、标语、口号、数字、关键名词短语）必须出现在最终 props 中的某个字段里，**不允许丢失**。哪怕字段的"建议字数"显得偏小，也要把完整内容放进去——schema 的字数只是布局提示，不是硬限制。
2. **重新分配，不要重新创作**：你的角色是分配员，不是缩写员。把用户给的内容拆分到不同槽位，不要把"百年老店"裁成"百年"，不要把"诺基亚 经典回归"丢掉"经典回归"。
3. **内容真的过多时**：把次要信息合并到 tagline / description / subtitle 之类的长字段里，**仍然不丢词**，可以微调连接词。
4. **内容过少时**：可适度补一句修饰语，但不要替换用户原文。

## 输出格式
只输出 JSON，包含上述所有字段。**不要输出 durationSeconds**——视频时长由模板自身决定。`;
}

function buildFreeformPrompt(
  propsSchema: string,
  colorScheme: { accent: string; background: string } | undefined,
  userPrompt: string
): string {
  const colorHint = colorScheme
    ? `

## ⚠️ 强制配色约束（最高优先级）
- **accentColor 必须设为**：${colorScheme.accent}
- **backgroundColor 必须设为**：${colorScheme.background}
所有色系字段使用以上配色或派生色。`
    : "";

  const inputLen = userPrompt.trim().length;
  const sceneHint =
    inputLen >= 200
      ? "**至少 6 个场景**（输入信息量大）"
      : inputLen >= 100
        ? "**5-7 个场景**"
        : inputLen >= 50
          ? "**4-6 个场景**"
          : "**3-5 个场景**";

  return `你是一名解说视频编辑。把用户输入完整地拆分到多个 scene 中，做成节奏分明的多场景解说视频。

## 模板 propsSchema（FreeformSceneScript）
${propsSchema}${colorHint}

## ⭐ 核心原则（按优先级）
1. **完整覆盖**：用户输入里的**所有要点、概念、数据、名词、句子**必须出现在某个场景的字段里。**禁止省略**。
2. **正确分配场景数**：本次推荐 ${sceneHint}。
3. **场景多样化**：至少使用 3 种不同 kind 交替（title → definition → bullets → callout → comparison → outro）。
4. **每个场景 durationFrames 单位是帧（30fps）**：
   - title / quote / callout：60-100 帧
   - definition / formula / outro：90-150 帧
   - bullets / comparison：120-180 帧（要点多则更长）
5. bullets 的 items 数组保留用户全部要点，不压缩条数。

## ⚠️ 严禁
- ❌ 用户写了 200 字，你只输出 2 个场景 100 帧（< 4 秒）
- ❌ 丢掉用户提到的具体术语、数字、人名、关键词
- ❌ 输出 \`durationSeconds\`

## 输出格式（严格 JSON）
{
  "scenes": [ { "kind": "...", "durationFrames": N, ... }, ... ],
  "accentColor": "#xxxxxx",
  "backgroundColor": "#xxxxxx"
}

只输出 JSON，不要任何额外文字或 markdown 代码块。`;
}

/**
 * 复合视频 prompt：让 LLM 同时输出
 * - intro：用户所选品牌模板的 props（极简、提炼）
 * - scenes：FreeformSceneScript 的 scenes 数组（完整内容）
 */
function buildCompositePrompt(
  introTemplateId: string,
  introSchema: string,
  colorScheme: { accent: string; background: string } | undefined,
  userPrompt: string
): string {
  const colorHint = colorScheme
    ? `

## ⚠️ 强制配色约束（最高优先级）
- **accentColor 必须设为**：${colorScheme.accent}
- **backgroundColor 必须设为**：${colorScheme.background}
intro.props 里的 accentColor / backgroundColor 也用这两个值。所有色系字段都用这个配色或派生色。`
    : "";

  const inputLen = userPrompt.trim().length;
  const sceneHint =
    inputLen >= 200
      ? "**至少 5 个场景**（输入信息量大）"
      : inputLen >= 100
        ? "**4-6 个场景**"
        : "**3-5 个场景**";

  return `你是一名视频内容编辑。这次要生成一支**复合视频**：

  [第一段 · 片头] 使用品牌模板 "${introTemplateId}"，做一个 3-7 秒的视觉冲击片头
  [第二段 · 解说] 使用 FreeformSceneScript 多场景，把用户完整内容展开
${colorHint}

## ⭐ 核心原则
**用户输入的全部要点、术语、数字、句子都必须出现在第二段的某个场景字段里，禁止省略。**
片头只放"提炼出的标题/品牌口号"，正文留给第二段展开。

────────────────────────────────────────────────────
## 第一段：片头 (${introTemplateId}) 的 props 字段
${introSchema}

要求：
- 从用户输入中提炼一个**短而有力**的核心标题或品牌口号填到片头
- 严格按字数建议（如 title 2-8 字、subtitle 5-20 字）
- 副标题/描述字段可以放一句点题语
- **不要把详细内容塞进片头**——详细内容是第二段的事
- accentColor / backgroundColor 用上面"强制配色"或合理默认

## 第二段：scenes 数组（FreeformSceneScript）

每个 scene 必须有 kind + durationFrames（30fps 单位），加上对应字段。可用 kind 与字段：

### 1. title — 大标题入场
{ "kind": "title", "text": "...", "subtitle": "可选", "durationFrames": 60-100 }

### 2. definition — 概念/定义卡片
{ "kind": "definition", "term": "...", "definition": "完整定义", "durationFrames": 90-150 }

### 3. bullets — 要点列表（必须保留用户全部要点，不压缩条数）
{ "kind": "bullets", "title": "...", "items": ["要点1", "要点2", ...], "durationFrames": 120-180 }

### 4. formula — 公式展示
{ "kind": "formula", "expression": "ΣF=0", "explanation": "可选", "durationFrames": 90-150 }

### 5. callout — 重点提示
{ "kind": "callout", "text": "一句话强调", "durationFrames": 60-100 }

### 6. quote — 引言/口诀
{ "kind": "quote", "text": "...", "author": "可选", "durationFrames": 60-100 }

### 7. comparison — 左右对比
{ "kind": "comparison", "title": "...", "left": {"label":"","body":""}, "right": {"label":"","body":""}, "durationFrames": 120-180 }

### 8. outro — 收尾小结
{ "kind": "outro", "title": "...", "summary": "...", "durationFrames": 90-150 }

要求：
- 场景数：${sceneHint}
- 至少使用 3 种不同 kind 交替，节奏才不单调
- 推荐编排：definition → bullets/comparison/formula × 2-3 → callout → outro（片头已在第一段，第二段不必再开 title）
- 但如果用户内容有明确的"分段标题"，可以用 title 场景做小节标题

────────────────────────────────────────────────────
## 输出格式（严格 JSON，不要 markdown 包裹）
{
  "intro": {
    /* 这里是 ${introTemplateId} 的 props 字段（直接平铺，不要嵌套 props 层） */
  },
  "scenes": [
    { "kind": "...", "durationFrames": N, /* ... */ },
    ...
  ],
  "accentColor": "#xxxxxx",
  "backgroundColor": "#xxxxxx"
}

⚠️ 严禁：丢掉用户输入里的任何要点、数字、人名、关键词；输出 markdown 代码块；输出 durationSeconds。`;
}

function buildAutoSelectPrompt(
  templateList: string,
  colorScheme: { accent: string; background: string } | undefined,
  userPrompt: string
): string {
  const colorHint = colorScheme
    ? `

## ⚠️ 强制配色约束（最高优先级）
- **accentColor 必须设为**：${colorScheme.accent}
- **backgroundColor 必须设为**：${colorScheme.background}
这是硬性要求。生成的 props 中所有色系字段都要使用以上配色或派生色。`
    : "";

  const inputLen = userPrompt.trim().length;
  const isLong = isLongInput(userPrompt);

  return `你是一名视频内容编辑。先判断用户输入属于哪一类，再选择最合适的模板，并把内容完整填入。

## 第一步：判断内容类型

### 类型 A：极短品牌/标题型
特征：用户输入是品牌名、产品名、人物头衔、slogan、口号、片头字幕等"短词组"（≤ 30 字、单句、无标点/换行）。
适用模板：SplitBrandIntro / JensenHuangCeoIntro / NeonTitle / LogoBrandReveal / ParticleWaveTitle / MinimalQuote / TypewriterText / CountdownTimer / GlitchHtmlCanvasSample

### 类型 B：解说/教学/概念讲解/产品详解型 ⭐
特征：需要"展开讲清楚"的内容；含多句、多个要点、超过 30-40 字。
**必选**：FreeformSceneScript

## ⚠️ 当前输入信息
- 输入长度：${inputLen} 字
- 是否长输入（系统判定）：${isLong ? "**是 → 强烈建议 FreeformSceneScript**" : "否，可考虑品牌模板"}

## 候选模板列表
${templateList}${colorHint}

## 第二步：填充 props

### 如果选了 FreeformSceneScript（类型 B）：
- 构造 scenes 数组（${inputLen >= 100 ? "5-7" : inputLen >= 50 ? "4-6" : "3-5"} 个场景）
- 每个 scene 有 kind + durationFrames + 对应字段
- 推荐：title → definition → bullets/formula/comparison × 2-3 → callout → outro
- **用户输入的所有实词、要点、概念都要分配进各 scene 的字段里，禁止省略**

### 如果选了类型 A 模板：
1. **完整保留用户原文**：所有实词分配到 props 中，禁止丢失
2. **不要输出 durationSeconds**

## 输出格式（严格 JSON）
{
  "templateId": "选中的模板 id",
  "props": { ... }
}

只输出 JSON。`;
}
