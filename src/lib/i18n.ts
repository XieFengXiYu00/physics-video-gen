export type Lang = "zh" | "en";

export type Translations = {
  appName: string;
  newChat: string;
  noHistory: string;
  localSaved: string;
  loadingApp: string;
  headerToday: string;
  limitReached: string;
  inputPlaceholder: string;
  inputPlaceholderDisabled: string;
  removeImage: string;
  emptyHeading: string;
  emptySubtext: string;
  examplePrompts: string[];
  stepGenerating: string;
  videoLabel: string;
  downloadVideo: string;
  downloadVideoProgress: string;
  regenerate: string;
  regeneratePrompt: string;
  uploadImage: string;
  dragDropHint: string;
  videoSec: string;
  templatePickerLabel: string;
  providerGemini: string;
  providerDeepSeek: string;
  providerLabel: string;
  processingPortrait: string;
  autoUpgradeHint: string;
  referenceImage: string;
};

export const TRANSLATIONS: Record<Lang, Translations> = {
  zh: {
    appName: "视频工坊",
    newChat: "+ 新对话",
    noHistory: "暂无历史对话",
    localSaved: "对话记录保存在本地",
    loadingApp: "加载中...",
    headerToday: "今日",
    limitReached: "今日使用次数已达上限",
    inputPlaceholder: "描述你想要的视频内容，例如：做一个科技感的频道片头...",
    inputPlaceholderDisabled: "今日使用次数已达上限",
    removeImage: "移除",
    emptyHeading: "视频工坊",
    emptySubtext: "按步骤选择风格、色系和比例，然后输入定制需求，AI 为你生成短视频。",
    examplePrompts: [] as string[],
    stepGenerating: "正在生成视频...",
    videoLabel: "生成视频",
    downloadVideo: "下载视频",
    downloadVideoProgress: "录制中",
    regenerate: "🔄 重新生成",
    regeneratePrompt: "请重新生成，保持原有风格但让动画更简洁流畅",
    uploadImage: "上传图片",
    dragDropHint: "松开上传图片",
    videoSec: "秒",
    templatePickerLabel: "选择视频风格",
    providerGemini: "Gemini",
    providerDeepSeek: "DeepSeek",
    providerLabel: "模型",
    processingPortrait: "正在抠图描边...",
    autoUpgradeHint: "内容较长，已自动在所选模板片头后追加多场景解说",
    referenceImage: "参考图",
  },
  en: {
    appName: "Video Studio",
    newChat: "+ New Chat",
    noHistory: "No history yet",
    localSaved: "History saved locally",
    loadingApp: "Loading...",
    headerToday: "Today",
    limitReached: "Daily limit reached",
    inputPlaceholder: "Describe the video you want, e.g.: Make a tech-style channel intro...",
    inputPlaceholderDisabled: "Daily limit reached",
    removeImage: "Remove",
    emptyHeading: "Video Studio",
    emptySubtext: "Choose style, colors, and aspect ratio step by step, then describe your needs.",
    examplePrompts: [] as string[],
    stepGenerating: "Generating video...",
    videoLabel: "Generated Video",
    downloadVideo: "Download Video",
    downloadVideoProgress: "Recording",
    regenerate: "🔄 Regenerate",
    regeneratePrompt: "Regenerate with same style but simpler, smoother animation",
    uploadImage: "Upload image",
    dragDropHint: "Drop image here",
    videoSec: "s",
    templatePickerLabel: "Choose a style",
    providerGemini: "Gemini",
    providerDeepSeek: "DeepSeek",
    providerLabel: "Model",
    processingPortrait: "Removing background...",
    autoUpgradeHint: "Long input — appended a multi-scene explainer after your selected template's intro.",
    referenceImage: "Reference",
  },
};
