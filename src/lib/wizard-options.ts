/**
 * Wizard step definitions for the new-conversation flow.
 * Each step has options; each option has an id + label.
 * "skip" is always available as the first implicit choice.
 */

export interface WizardOption {
  id: string;
  labelZh: string;
  labelEn: string;
  /** Optional visual hint (emoji, hex color swatch, etc.) */
  icon?: string;
  /** Description shown below label in card mode */
  descZh?: string;
  descEn?: string;
  /** Static preview image path (in /public/previews/) */
  preview?: string;
}

export interface WizardStep {
  key: string;
  titleZh: string;
  titleEn: string;
  options: WizardOption[];
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    key: "style",
    titleZh: "视频风格",
    titleEn: "style",
    options: [
      { id: "SplitBrandIntro", labelZh: "品牌分词片头", labelEn: "Brand Intro", icon: "🎬", descZh: "黑底 + 粗体分词 + 高亮色", descEn: "Bold split text with accent color", preview: "/previews/split-brand-intro.svg" },
      { id: "JensenHuangCeoIntro", labelZh: "赛博CEO介绍", labelEn: "Cyber CEO", icon: "🤖", descZh: "矩阵雨 + 科技环 + HUD面板", descEn: "Matrix rain + tech rings + HUD", preview: "/previews/jensen-ceo-intro.svg" },
      { id: "GlitchHtmlCanvasSample", labelZh: "故障艺术", labelEn: "Glitch Art", icon: "📺", descZh: "故障效果 + 扫描线 + 色偏", descEn: "Glitch + scanlines + chroma shift", preview: "/previews/glitch-art.svg" },
      { id: "TypewriterText", labelZh: "打字机文字", labelEn: "Typewriter", icon: "⌨️", descZh: "逐字打出 + 闪烁光标", descEn: "Character-by-character typing", preview: "/previews/typewriter-text.svg" },
      { id: "CountdownTimer", labelZh: "倒计时", labelEn: "Countdown", icon: "⏱️", descZh: "数字倒计时 + 圆环进度条", descEn: "Number countdown + progress ring", preview: "/previews/countdown-timer.svg" },
      { id: "NeonTitle", labelZh: "霓虹灯标题", labelEn: "Neon Title", icon: "💡", descZh: "霓虹发光 + 闪烁 + 砖墙背景", descEn: "Neon glow + flicker + brick wall", preview: "/previews/neon-title.svg" },
      { id: "MinimalQuote", labelZh: "简约引言", labelEn: "Minimal Quote", icon: "✍️", descZh: "大引号 + 淡入文字 + 作者署名", descEn: "Quote card with author signature", preview: "/previews/minimal-quote.svg" },
      { id: "ParticleWaveTitle", labelZh: "粒子波浪", labelEn: "Particle Wave", icon: "🌊", descZh: "粒子连线 + 波浪浮动 + 标题弹入", descEn: "Particle wave with connections", preview: "/previews/particle-wave.svg" },
      { id: "LogoBrandReveal", labelZh: "Logo品牌揭示", labelEn: "Logo Brand Reveal", icon: "✨", descZh: "光环 → Logo圆形揭示 → 扫光品牌名", descEn: "Pulse rings → logo circle → paint-sweep wordmark" },
      { id: "FreeformSceneScript", labelZh: "通用解说视频", labelEn: "Freeform Explainer", icon: "🎓", descZh: "知识科普/教学/讲解：标题/定义/要点/公式/对比/小结自由组合", descEn: "Multi-scene explainer for knowledge/tutorials/concepts" },
    ],
  },
  {
    key: "color",
    titleZh: "色系",
    titleEn: "color scheme",
    options: [
      { id: "dark", labelZh: "暗黑", labelEn: "Dark", icon: "⚫" },
      { id: "light", labelZh: "明亮", labelEn: "Light", icon: "⚪" },
      { id: "warm", labelZh: "暖色", labelEn: "Warm", icon: "🟠" },
      { id: "cool", labelZh: "冷色", labelEn: "Cool", icon: "🔵" },
      { id: "neon", labelZh: "霓虹", labelEn: "Neon", icon: "🟣" },
    ],
  },
  {
    key: "ratio",
    titleZh: "视频比例",
    titleEn: "aspect ratio",
    options: [
      { id: "16:9", labelZh: "16:9 横屏", labelEn: "16:9 Landscape", icon: "🖥️" },
      { id: "9:16", labelZh: "9:16 竖屏", labelEn: "9:16 Portrait", icon: "📱" },
      { id: "1:1", labelZh: "1:1 方形", labelEn: "1:1 Square", icon: "⬜" },
    ],
  },
];

/** Map ratio id → pixel dimensions */
export const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 720, height: 720 },
};

/** Map color scheme id → suggested colors for LLM */
export const COLOR_SCHEMES: Record<string, { accent: string; background: string }> = {
  dark: { accent: "#ffffff", background: "#0a0a0a" },
  light: { accent: "#333333", background: "#f8f8f8" },
  warm: { accent: "#ff6700", background: "#1a0a00" },
  cool: { accent: "#00d4ff", background: "#0a0a1a" },
  neon: { accent: "#c026d3", background: "#0f0019" },
};
