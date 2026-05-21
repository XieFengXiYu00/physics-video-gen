/**
 * CompositeVideo — 复合视频模板
 * ──────────────────────────────────────────────────────────────────────
 * 用 <Series> 把"用户选中的品牌片头模板"和"FreeformSceneScript 多场景解说"
 * 串联起来：
 *   片头（N 帧的品牌模板，如 NeonTitle / Jensen / Particle）
 *   → 多场景解说（剩余内容拆成 3-8 个 scene 展开）
 *
 * 服务端在检测到"长输入 + 单屏品牌模板"时会自动走这条路径，让用户既能
 * 保留所选模板的视觉风格（开场片头），又能完整展示长篇内容。
 */

import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { SplitBrandIntro } from "./SplitBrandIntro";
import { JensenHuangCeoIntro } from "./JensenHuangCeoIntro";
import { GlitchHtmlCanvasSample } from "./GlitchHtmlCanvasSample";
import { TypewriterText } from "./TypewriterText";
import { CountdownTimer } from "./CountdownTimer";
import { NeonTitle } from "./NeonTitle";
import { MinimalQuote } from "./MinimalQuote";
import { ParticleWaveTitle } from "./ParticleWaveTitle";
import { LogoBrandReveal } from "./LogoBrandReveal";
import {
  FreeformSceneScript,
  freeformSceneScriptDefaultProps,
  getFreeformTotalFrames,
} from "./FreeformSceneScript";
import type { FreeformScene } from "./FreeformSceneScript.types";

// templateId → 品牌片头组件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const INTRO_COMPONENTS: Record<string, React.ComponentType<any>> = {
  SplitBrandIntro,
  JensenHuangCeoIntro,
  GlitchHtmlCanvasSample,
  TypewriterText,
  CountdownTimer,
  NeonTitle,
  MinimalQuote,
  ParticleWaveTitle,
  LogoBrandReveal,
};

export type CompositeVideoProps = {
  /** 用作片头的品牌模板 id（必须在 INTRO_COMPONENTS 中存在） */
  introTemplateId: string;
  /** 传给片头模板的 props */
  introProps: Record<string, unknown>;
  /** 片头持续帧数（一般用品牌模板的默认 durationFrames） */
  introDurationFrames: number;
  /** 后续多场景内容 */
  scenes: FreeformScene[];
  /** 主题高亮色（同时也是 freeform 段落用色） */
  accentColor: string;
  /** 背景色（外层兜底；各品牌模板自己也会设） */
  backgroundColor: string;
};

export const compositeVideoDefaultProps: CompositeVideoProps = {
  introTemplateId: "NeonTitle",
  introProps: {
    title: "AI FUTURE",
    subtitle: "趋势报告",
    accentColor: "#e879f9",
    backgroundColor: "#09090b",
  },
  introDurationFrames: 150,
  scenes: freeformSceneScriptDefaultProps.scenes,
  accentColor: "#e879f9",
  backgroundColor: "#09090b",
};

/** 计算复合视频总帧数。route.ts / Root.tsx 都用这个。 */
export function getCompositeTotalFrames(props: CompositeVideoProps): number {
  const intro = Math.max(30, props.introDurationFrames || 90);
  const body = getFreeformTotalFrames(props.scenes);
  return intro + body;
}

export function CompositeVideo({
  introTemplateId = compositeVideoDefaultProps.introTemplateId,
  introProps = compositeVideoDefaultProps.introProps,
  introDurationFrames = compositeVideoDefaultProps.introDurationFrames,
  scenes = compositeVideoDefaultProps.scenes,
  accentColor = compositeVideoDefaultProps.accentColor,
  backgroundColor = compositeVideoDefaultProps.backgroundColor,
}: Partial<CompositeVideoProps> = {}) {
  const IntroComp = INTRO_COMPONENTS[introTemplateId];
  const safeScenes: FreeformScene[] =
    Array.isArray(scenes) && scenes.length > 0
      ? scenes
      : freeformSceneScriptDefaultProps.scenes;

  const introFrames = Math.max(30, introDurationFrames || 90);
  const bodyFrames = getFreeformTotalFrames(safeScenes);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <Series>
        {IntroComp && (
          <Series.Sequence durationInFrames={introFrames}>
            <IntroComp {...introProps} />
          </Series.Sequence>
        )}
        <Series.Sequence durationInFrames={bodyFrames}>
          <FreeformSceneScript
            scenes={safeScenes}
            accentColor={accentColor}
            backgroundColor={backgroundColor}
          />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
