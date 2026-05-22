/**
 * Template registry — maps template IDs to metadata used by both
 * the LLM prompt generator and the frontend player.
 */

import type { SplitBrandIntroProps } from "@/remotion/SplitBrandIntro";
import type { JensenHuangCeoIntroProps } from "@/remotion/JensenHuangCeoIntro";
import type { GlitchHtmlCanvasSampleProps } from "@/remotion/GlitchHtmlCanvasSample";
import type { TypewriterTextProps } from "@/remotion/TypewriterText";
import type { CountdownTimerProps } from "@/remotion/CountdownTimer";
import type { NeonTitleProps } from "@/remotion/NeonTitle";
import type { MinimalQuoteProps } from "@/remotion/MinimalQuote";
import type { ParticleWaveTitleProps } from "@/remotion/ParticleWaveTitle";
import type { LogoBrandRevealProps } from "@/remotion/LogoBrandReveal";
import {
  freeformSceneScriptDefaultProps,
  getFreeformTotalFrames,
  type FreeformSceneScriptProps,
} from "@/remotion/FreeformSceneScript.types";

export interface TemplateInfo {
  id: string;
  /** Display name (zh) */
  labelZh: string;
  /** Display name (en) */
  labelEn: string;
  /** Short description */
  descZh: string;
  descEn: string;
  /** Duration in frames (at 30 fps) */
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
  /** JSON schema description for LLM */
  propsSchema: string;
  /** Default props as JSON string */
  defaultProps: string;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "SplitBrandIntro",
    labelZh: "品牌分词片头",
    labelEn: "Split Brand Intro",
    descZh: "黑底 + 粗体分词 + 高亮色，适合片头或频道介绍",
    descEn: "Dark background, bold split text with accent color, great for intros",
    durationFrames: 150,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "prefix": "string — 左侧主词（主区域，建议2-6字，核心概念的前半部分）",
  "suffix": "string — 右侧高亮词（主区域，建议1-4字，与prefix组合成完整概念，此词会有高亮色强调）",
  "accentColor": "string — 高亮色，十六进制，例如 #ff6700",
  "backgroundColor": "string — 背景色，十六进制，例如 #0a0a0a"
}`,
    defaultProps: JSON.stringify({
      prefix: "我的",
      suffix: "频道",
      accentColor: "#ff6700",
      backgroundColor: "#0a0a0a",
    } satisfies SplitBrandIntroProps),
  },
  {
    id: "JensenHuangCeoIntro",
    labelZh: "赛博CEO介绍",
    labelEn: "Cyber CEO Intro",
    descZh: "赛博朋克风 CEO 介绍，矩阵雨+科技环+HUD面板",
    descEn: "Cyberpunk CEO intro with matrix rain, tech rings, and HUD panel",
    durationFrames: 180,
    fps: 30,
    width: 1920,
    height: 1080,
    propsSchema: `{
  "name": "string — 开场大字标题（2-10字，人名/品牌名/核心词汇，字体极大全屏居中，0-50帧短暂出现）",
  "role": "string — HUD面板标题行（4-25字，职位/头衔/角色定位，醒目大字显示）",
  "description": "string — HUD面板正文（30-150字，可使用 \\\\n 分段，详细介绍人物背景/公司业务/核心成就/价值主张等。建议2-4个短句或要点，让内容更充实，正文区域足够大可容纳较多文字）",
  "accentColor": "string — 主题色，十六进制（决定所有装饰元素：矩阵雨/科技环/扫描线/角标/HUD边框等的颜色，全局生效）",
  "backgroundColor": "string — 画布背景色，十六进制（推荐深色如 #0a1408 与 accentColor 形成对比；浅色背景也支持）"
}`,
    defaultProps: JSON.stringify({
      name: "Jensen Huang",
      role: "CEO & Co-Founder",
      description:
        "NVIDIA Corporation · Accelerated computing & AI platforms.\n推动加速计算与生成式 AI 进入千行百业，重塑下一代算力基础设施。",
      accentColor: "#76B900",
      backgroundColor: "#0a1408",
    } satisfies JensenHuangCeoIntroProps),
  },
  {
    id: "LogoBrandReveal",
    labelZh: "Logo品牌揭示",
    labelEn: "Logo Brand Reveal",
    descZh: "三幕式品牌片头：脉冲光环 → Logo圆形揭示 → 品牌名扫光+倾斜高亮块+副标语逐字淡入",
    descEn: "Three-act brand intro: pulse rings → logo circle reveal → paint-sweep wordmark with tilted accent tile",
    durationFrames: 210,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "initials": "string — 第一幕大字冲击的品牌简称/首字母（理想2-5字符，可放品牌简写或核心词；显示空间充足）",
  "brandName": "string — 主品牌名，扫光揭示（理想2-8字，但接受更长品牌名；显示空间充足，宽屏布局）",
  "accentWord": "string — 高亮块词，倾斜弹入显示在品牌名右侧（理想1-6字，可放短slogan/品类词；不要为了字数砍掉用户实词）",
  "tagline": "string — 副标语，逐字淡入显示在品牌名下方（理想5-25字，品牌slogan/定位语/补充说明；可承载较多文字）",
  "accentColor": "string — 主题高亮色，十六进制，推荐高饱和色如 #f39200",
  "backgroundColor": "string — 背景色，十六进制，建议深色如 #050505"
}`,
    defaultProps: JSON.stringify({
      initials: "AI",
      brandName: "PHYSIQ",
      accentWord: "AI",
      tagline: "让每一帧都有意义",
      accentColor: "#f39200",
      backgroundColor: "#050505",
    } satisfies LogoBrandRevealProps),
  },
  {
    id: "GlitchHtmlCanvasSample",
    labelZh: "故障艺术",
    labelEn: "Glitch Art",
    descZh: "canvas 故障效果 + 扫描线 + 色偏分离，适合科技/黑客风格",
    descEn: "Canvas glitch effect with scanlines and chroma shift",
    durationFrames: 150,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "title": "string — 主区域大标题（建议2-8字，故障效果文字，字体极大居中，字数过多会溢出）",
  "subtitle": "string — 次要标题行（建议3-15字，显示在title下方，有高亮色）",
  "description": "string — 描述文字（建议10-35字，一句话补充说明）",
  "accentColor": "string — 副标题和特效颜色，十六进制，例如 #a78bfa",
  "backgroundColor": "string — 背景色，十六进制，例如 #0d0d12"
}`,
    defaultProps: JSON.stringify({
      title: "GLITCH ART",
      subtitle: "故障艺术",
      description: "赛博朋克风格故障效果展示",
      accentColor: "#a78bfa",
      backgroundColor: "#0d0d12",
    } satisfies GlitchHtmlCanvasSampleProps),
  },
  {
    id: "TypewriterText",
    labelZh: "打字机文字",
    labelEn: "Typewriter Text",
    descZh: "逐字打出效果 + 闪烁光标，适合编程/知识类博主片头",
    descEn: "Character-by-character typewriter with blinking cursor",
    durationFrames: 180,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "text": "string — 打字机逐字显示的主标题（建议5-25个字符，这是视频的核心展示内容，字数决定打字动画时长）",
  "subtitle": "string — 打字完成后淡入的副标题（建议8-30字，对text的补充说明或slogan）",
  "accentColor": "string — 光标和副标题颜色，十六进制",
  "backgroundColor": "string — 背景色，十六进制"
}`,
    defaultProps: JSON.stringify({
      text: "Hello World",
      subtitle: "欢迎来到我的频道",
      accentColor: "#22d3ee",
      backgroundColor: "#0a0a0a",
    } satisfies TypewriterTextProps),
  },
  {
    id: "CountdownTimer",
    labelZh: "倒计时",
    labelEn: "Countdown Timer",
    descZh: "数字倒计时 + 圆环进度条 + 结束爆炸标题，适合视频开场",
    descEn: "Number countdown with progress ring and explosive title finish",
    durationFrames: 150,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "countFrom": "number — 倒计时起始数字，3-10 之间",
  "title": "string — 倒计时结束后显示的标题",
  "accentColor": "string — 主题色，十六进制",
  "backgroundColor": "string — 背景色，十六进制"
}`,
    defaultProps: JSON.stringify({
      countFrom: 3,
      title: "GO!",
      accentColor: "#f97316",
      backgroundColor: "#0a0a0a",
    } satisfies CountdownTimerProps),
  },
  {
    id: "NeonTitle",
    labelZh: "霓虹灯标题",
    labelEn: "Neon Title",
    descZh: "霓虹灯发光文字 + 闪烁效果 + 砖墙背景，适合潮流/电竞风格",
    descEn: "Neon glow text with flicker effect and brick wall background",
    durationFrames: 150,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "title": "string — 主区域霓虹灯大字（建议2-8字，字体极大全屏居中，超过8字会显得拥挤）",
  "subtitle": "string — 副标题（建议5-20字，显示在title下方，较小字号）",
  "accentColor": "string — 霓虹灯颜色，十六进制，推荐亮色如 #e879f9",
  "backgroundColor": "string — 背景色，十六进制，建议深色"
}`,
    defaultProps: JSON.stringify({
      title: "NEON",
      subtitle: "霓虹灯效果",
      accentColor: "#e879f9",
      backgroundColor: "#09090b",
    } satisfies NeonTitleProps),
  },
  {
    id: "MinimalQuote",
    labelZh: "简约引言",
    labelEn: "Minimal Quote",
    descZh: "大引号装饰 + 逐行淡入文字 + 作者署名，适合金句/名言分享",
    descEn: "Clean quote card with decorative quotation mark, text fade-in, and author",
    durationFrames: 180,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "quote": "string — 引言正文（建议15-60字，大字居中展示，是视频的主体内容；内容过多时提炼为一句核心语句）",
  "author": "string — 署名（建议2-20字，人名/来源/品牌，显示在引言下方小字）",
  "accentColor": "string — 装饰线和引号颜色，十六进制",
  "backgroundColor": "string — 背景色，十六进制，支持浅色或深色"
}`,
    defaultProps: JSON.stringify({
      quote: "简约是终极的复杂。",
      author: "达·芬奇",
      accentColor: "#facc15",
      backgroundColor: "#fafaf9",
    } satisfies MinimalQuoteProps),
  },
  {
    id: "ParticleWaveTitle",
    labelZh: "粒子波浪标题",
    labelEn: "Particle Wave Title",
    descZh: "底部粒子波浪浮动 + 连线效果 + 标题弹入，适合科技/AI 主题",
    descEn: "Floating particle wave with connection lines and title spring-in",
    durationFrames: 180,
    fps: 30,
    width: 1280,
    height: 720,
    propsSchema: `{
  "title": "string — 主区域大标题（建议2-10字，全大写英文或中文均可，弹入动画，字体极大）",
  "subtitle": "string — 副标题描述（建议8-30字，显示在title下方，描述主题或slogan）",
  "accentColor": "string — 粒子和高亮色，十六进制",
  "backgroundColor": "string — 背景色，十六进制，建议深色"
}`,
    defaultProps: JSON.stringify({
      title: "AI FUTURE",
      subtitle: "探索人工智能的无限可能",
      accentColor: "#3b82f6",
      backgroundColor: "#030712",
    } satisfies ParticleWaveTitleProps),
  },
  {
    // ────────────────────────────────────────────────────────────────
    // FreeformSceneScript — 通用解说视频模板（"自由发挥"兜底）
    // 当用户输入是知识科普 / 教学 / 概念讲解 / 产品功能详解等"非品牌"
    // 内容时，LLM 通过组合 scene kinds 自由编排一支完整解说视频。
    // ────────────────────────────────────────────────────────────────
    id: "FreeformSceneScript",
    labelZh: "通用解说视频",
    labelEn: "Freeform Explainer",
    descZh:
      "🎓 自由发挥型多场景模板：标题/定义/要点/公式/重点/引言/对比/小结八种场景任意组合，适合知识科普、教学、概念讲解、产品详解",
    descEn:
      "Multi-scene freeform template: title/definition/bullets/formula/callout/quote/comparison/outro — perfect for explanations, tutorials, concepts",
    durationFrames: getFreeformTotalFrames(freeformSceneScriptDefaultProps.scenes),
    fps: 30,
    width: 1920,
    height: 1080,
    propsSchema: `{
  "scenes": "Array<Scene> — 场景序列，3-8个场景，按播放顺序排列。每个场景独立显示约 3-5 秒。**LLM 自由决定使用哪些 kind、用几个、各多长**。所有可用 kind 见下方。",
  "accentColor": "string — 主题高亮色，十六进制（按钮/数字球/装饰条/边框/光晕统一使用）",
  "backgroundColor": "string — 画布背景色，十六进制（深色推荐 #0a0a1a / #050505，浅色支持 #f8f8f8）"
}

## Scene kinds（每个场景必须有 kind + durationFrames，durationFrames 单位为帧 @ 30fps，建议 60-180）：

### 1. title — 大标题入场（开场用，3 秒左右）
{ "kind": "title", "text": "牛顿第一定律", "subtitle": "可选副标题", "durationFrames": 90 }

### 2. definition — 概念定义卡片（4 秒）
{ "kind": "definition", "term": "惯性定律", "definition": "完整的定义文本，可以较长", "durationFrames": 120 }

### 3. bullets — 要点列表（每条要点 0.6 秒入场，建议 2-5 条，4-5 秒）
{ "kind": "bullets", "title": "三个关键点", "items": ["要点一", "要点二", "要点三"], "durationFrames": 150 }

### 4. formula — 公式展示（3-4 秒。用普通字符表达，如 ΣF=0 / E=mc² / v=v₀+at）
{ "kind": "formula", "expression": "ΣF = 0  ⇒  v = const", "explanation": "可选解释", "durationFrames": 100 }

### 5. callout — 重点提示卡片（一句话强调，3 秒）
{ "kind": "callout", "text": "记住：运动不需要力来维持", "durationFrames": 90 }

### 6. quote — 引言 / 口诀（3-4 秒）
{ "kind": "quote", "text": "万物皆有惯性", "author": "牛顿", "durationFrames": 100 }

### 7. comparison — 左右对比（5 秒）
{ "kind": "comparison", "title": "对比", "left": { "label": "错误观念", "body": "需要力才能运动" }, "right": { "label": "正确理解", "body": "无外力时匀速运动" }, "durationFrames": 150 }

### 8. outro — 收尾小结（3-4 秒，建议放最后）
{ "kind": "outro", "title": "记住这一点", "summary": "运动状态的改变才需要力", "durationFrames": 100 }

## 编排建议
- 典型结构：title → definition → (bullets|comparison|formula) × 2-4 → outro
- 不要全用同一种 kind，至少 3 种以上交替，节奏才好
- 公式简单的概念可省略 formula 场景；纯文科可全用 bullets/quote/callout`,
    defaultProps: JSON.stringify(
      freeformSceneScriptDefaultProps satisfies FreeformSceneScriptProps
    ),
  },
];

export function getTemplate(id: string): TemplateInfo | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
