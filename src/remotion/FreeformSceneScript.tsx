/**
 * FreeformSceneScript — 通用解说视频模板
 * ──────────────────────────────────────────────────────────────────────
 * 接收一个"场景脚本"数组，LLM 自由决定使用哪些 scene kind、各多长。
 * 用 <Series.Sequence> 串联，每个子场景独立 frame=0 起算。
 *
 * 设计目标：当用户输入是知识科普、概念讲解、教学内容这类"非品牌"
 * 内容时，LLM 通过组合下列 scene kind 自由编排一支解说视频。
 *
 * 当前支持的 scene kinds：
 *   - title       : 大标题闪入
 *   - definition  : 术语 + 定义
 *   - bullets     : 标题 + 要点列表
 *   - formula     : 公式 + 解释
 *   - callout     : 重点提示卡片
 *   - quote       : 引言 / 口诀
 *   - comparison  : 左右对比
 *   - outro       : 收尾小结
 */

import {
  AbsoluteFill,
  interpolate,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties } from "react";
import {
  freeformSceneScriptDefaultProps,
  type BulletsScene,
  type CalloutScene,
  type ComparisonScene,
  type DefinitionScene,
  type FormulaScene,
  type FreeformScene,
  type FreeformSceneScriptProps,
  type OutroScene,
  type QuoteScene,
  type TitleScene,
} from "./FreeformSceneScript.types";

// 重新导出类型与默认值，保持外部 import 兼容
export {
  freeformSceneScriptDefaultProps,
  getFreeformTotalFrames,
} from "./FreeformSceneScript.types";
export type {
  BulletsScene,
  CalloutScene,
  ComparisonScene,
  DefinitionScene,
  FormulaScene,
  FreeformScene,
  FreeformSceneScriptProps,
  OutroScene,
  QuoteScene,
  TitleScene,
} from "./FreeformSceneScript.types";

// ════════════════════════════════════════════════════════════════════
// 工具函数
// ════════════════════════════════════════════════════════════════════

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isDarkColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 < 130;
}

const FONT_STACK =
  '"Inter", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif';
const MONO_STACK =
  'ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, monospace';

// ════════════════════════════════════════════════════════════════════
// 入场 / 出场 helpers — 给所有 scene 子组件复用
// ════════════════════════════════════════════════════════════════════

function useSceneTransition() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 入场：spring 弹入（前 18 帧）
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.7 },
    durationInFrames: 18,
  });

  // 出场：最后 12 帧线性淡出
  const exit = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = enter * exit;
  const translateY = interpolate(enter, [0, 1], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { opacity, translateY, enter, exit, frame };
}

// ════════════════════════════════════════════════════════════════════
// 全局背景层（所有场景共享）
// ════════════════════════════════════════════════════════════════════

function BackgroundLayer({
  accentColor,
  backgroundColor,
}: {
  accentColor: string;
  backgroundColor: string;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dark = isDarkColor(backgroundColor);

  // 缓慢漂移的两团光晕
  const blob1X = Math.sin(frame * 0.005) * 100;
  const blob1Y = Math.cos(frame * 0.004) * 60;
  const blob2X = Math.cos(frame * 0.006 + 1.5) * 120;
  const blob2Y = Math.sin(frame * 0.005 + 1) * 80;

  return (
    <>
      <AbsoluteFill style={{ backgroundColor }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 45% at ${30 + blob1X / 8}% ${
            35 + blob1Y / 8
          }%, ${withAlpha(accentColor, dark ? 0.18 : 0.22)} 0%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 45% 40% at ${70 + blob2X / 8}% ${
            65 + blob2Y / 8
          }%, ${withAlpha(accentColor, dark ? 0.12 : 0.18)} 0%, transparent 65%)`,
        }}
      />
      {/* 噪点纹理 */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", opacity: dark ? 0.06 : 0.04 }}
      >
        <filter id="freeformNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#freeformNoise)" />
      </svg>
      {/* 顶部 / 底部细线装饰 */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          right: 60,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${withAlpha(
            accentColor,
            0.4
          )} 20%, ${withAlpha(accentColor, 0.4)} 80%, transparent)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 60,
          right: 60,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${withAlpha(
            accentColor,
            0.4
          )} 20%, ${withAlpha(accentColor, 0.4)} 80%, transparent)`,
        }}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// Scene 子组件
// ════════════════════════════════════════════════════════════════════

function TitleSceneRenderer({
  scene,
  accentColor,
}: {
  scene: TitleScene;
  accentColor: string;
}) {
  const { opacity, translateY, enter } = useSceneTransition();
  const { width } = useVideoConfig();
  const titleScale = interpolate(enter, [0, 1], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fontSize = Math.min(140, width * 0.085);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          width: 80,
          height: 4,
          background: accentColor,
          marginBottom: 32,
          borderRadius: 2,
          boxShadow: `0 0 24px ${withAlpha(accentColor, 0.7)}`,
          transform: `scaleX(${enter})`,
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize,
          fontWeight: 900,
          color: accentColor,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          textAlign: "center",
          transform: `scale(${titleScale}) translateY(${translateY}px)`,
          textShadow: `0 0 40px ${withAlpha(accentColor, 0.4)}`,
          maxWidth: width - 160,
        }}
      >
        {scene.text}
      </div>
      {scene.subtitle && (
        <div
          style={{
            marginTop: 28,
            fontFamily: MONO_STACK,
            fontSize: 28,
            color: withAlpha("#ffffff", 0.75),
            letterSpacing: "0.06em",
            textAlign: "center",
            transform: `translateY(${translateY}px)`,
          }}
        >
          {scene.subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
}

function DefinitionSceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: DefinitionScene;
  accentColor: string;
  backgroundColor: string;
}) {
  const { opacity, translateY, enter } = useSceneTransition();
  const { width } = useVideoConfig();
  const dark = isDarkColor(backgroundColor);
  const cardW = Math.min(1280, width - 200);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          width: cardW,
          background: dark
            ? withAlpha("#ffffff", 0.04)
            : withAlpha("#000000", 0.04),
          border: `1px solid ${withAlpha(accentColor, 0.35)}`,
          borderRadius: 12,
          padding: "56px 64px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: `0 0 60px ${withAlpha(accentColor, 0.15)}`,
          transform: `translateY(${translateY}px) scale(${interpolate(
            enter,
            [0, 1],
            [0.96, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )})`,
        }}
      >
        {/* 标签 */}
        <div
          style={{
            display: "inline-block",
            padding: "6px 14px",
            background: withAlpha(accentColor, 0.18),
            color: accentColor,
            fontFamily: MONO_STACK,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.12em",
            borderRadius: 4,
            marginBottom: 28,
            textTransform: "uppercase",
          }}
        >
          Definition
        </div>
        {/* 术语 */}
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 64,
            fontWeight: 800,
            color: dark ? "#ffffff" : "#0a0a0a",
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: "-0.01em",
          }}
        >
          {scene.term}
        </div>
        {/* 装饰线 */}
        <div
          style={{
            width: 60,
            height: 3,
            background: accentColor,
            marginBottom: 28,
            borderRadius: 2,
          }}
        />
        {/* 定义正文 */}
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 30,
            lineHeight: 1.65,
            color: dark
              ? withAlpha("#ffffff", 0.88)
              : withAlpha("#000000", 0.85),
            wordBreak: "break-word",
          }}
        >
          {scene.definition}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function BulletsSceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: BulletsScene;
  accentColor: string;
  backgroundColor: string;
}) {
  const { opacity, frame } = useSceneTransition();
  const { fps, width } = useVideoConfig();
  const dark = isDarkColor(backgroundColor);
  const cardW = Math.min(1280, width - 200);

  // 标题 spring
  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 16,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div style={{ width: cardW }}>
        {/* 标题 */}
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 56,
            fontWeight: 800,
            color: dark ? "#ffffff" : "#0a0a0a",
            marginBottom: 20,
            letterSpacing: "-0.01em",
            transform: `translateY(${interpolate(titleEnter, [0, 1], [20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            width: 60,
            height: 3,
            background: accentColor,
            marginBottom: 44,
            borderRadius: 2,
            transform: `scaleX(${titleEnter})`,
            transformOrigin: "left center",
          }}
        />
        {/* 要点逐条入场 */}
        {scene.items.map((item, i) => {
          const itemDelay = 14 + i * 10;
          const itemEnter = spring({
            frame: frame - itemDelay,
            fps,
            config: { damping: 13, stiffness: 105 },
            durationInFrames: 14,
          });
          const itemX = interpolate(itemEnter, [0, 1], [-40, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 24,
                marginBottom: 28,
                opacity: itemEnter,
                transform: `translateX(${itemX}px)`,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: withAlpha(accentColor, 0.18),
                  border: `2px solid ${accentColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: MONO_STACK,
                  fontSize: 22,
                  fontWeight: 800,
                  color: accentColor,
                  marginTop: 4,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  fontFamily: FONT_STACK,
                  fontSize: 32,
                  lineHeight: 1.55,
                  color: dark
                    ? withAlpha("#ffffff", 0.92)
                    : withAlpha("#000000", 0.88),
                  wordBreak: "break-word",
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function FormulaSceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: FormulaScene;
  accentColor: string;
  backgroundColor: string;
}) {
  const { opacity, enter, translateY } = useSceneTransition();
  const dark = isDarkColor(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "8px 18px",
          background: withAlpha(accentColor, 0.18),
          color: accentColor,
          fontFamily: MONO_STACK,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.14em",
          borderRadius: 4,
          marginBottom: 40,
          textTransform: "uppercase",
          transform: `translateY(${translateY}px)`,
        }}
      >
        Formula
      </div>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize: 96,
          fontWeight: 700,
          color: dark ? "#ffffff" : "#0a0a0a",
          letterSpacing: "0.04em",
          textAlign: "center",
          padding: "32px 56px",
          background: dark
            ? withAlpha("#ffffff", 0.05)
            : withAlpha("#000000", 0.05),
          border: `2px solid ${withAlpha(accentColor, 0.5)}`,
          borderRadius: 8,
          boxShadow: `0 0 50px ${withAlpha(accentColor, 0.2)}`,
          transform: `scale(${interpolate(enter, [0, 1], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          textShadow: `0 0 30px ${withAlpha(accentColor, 0.3)}`,
          maxWidth: "85%",
          wordBreak: "break-word",
        }}
      >
        {scene.expression}
      </div>
      {scene.explanation && (
        <div
          style={{
            marginTop: 36,
            fontFamily: FONT_STACK,
            fontSize: 26,
            color: dark
              ? withAlpha("#ffffff", 0.75)
              : withAlpha("#000000", 0.7),
            textAlign: "center",
            maxWidth: "70%",
            transform: `translateY(${translateY}px)`,
            wordBreak: "break-word",
          }}
        >
          {scene.explanation}
        </div>
      )}
    </AbsoluteFill>
  );
}

function CalloutSceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: CalloutScene;
  accentColor: string;
  backgroundColor: string;
}) {
  const { opacity, enter } = useSceneTransition();
  const { fps, width } = useVideoConfig();
  const dark = isDarkColor(backgroundColor);
  // 微微脉动
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.06) * 0.012;

  // 左侧高亮条
  const barX = interpolate(enter, [0, 1], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          maxWidth: Math.min(1180, width - 160),
          transform: `scale(${pulse})`,
        }}
      >
        <div
          style={{
            width: 10,
            background: accentColor,
            borderRadius: "4px 0 0 4px",
            transform: `translateX(${barX}px)`,
            boxShadow: `0 0 30px ${withAlpha(accentColor, 0.7)}`,
          }}
        />
        <div
          style={{
            background: dark
              ? withAlpha(accentColor, 0.08)
              : withAlpha(accentColor, 0.1),
            border: `1px solid ${withAlpha(accentColor, 0.4)}`,
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            padding: "44px 56px",
            fontFamily: FONT_STACK,
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.4,
            color: dark ? "#ffffff" : "#0a0a0a",
            wordBreak: "break-word",
          }}
        >
          {scene.text}
        </div>
      </div>
      {/* 顶部小标签 */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% - 240px)",
          fontFamily: MONO_STACK,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.24em",
          color: accentColor,
          textTransform: "uppercase",
          opacity: enter,
        }}
      >
        — KEY POINT —
      </div>
    </AbsoluteFill>
  );
}

function QuoteSceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: QuoteScene;
  accentColor: string;
  backgroundColor: string;
}) {
  const { opacity, enter, translateY } = useSceneTransition();
  const { width } = useVideoConfig();
  const dark = isDarkColor(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontSize: 240,
          color: accentColor,
          opacity: 0.45,
          lineHeight: 0.7,
          fontWeight: 700,
          marginBottom: -40,
          transform: `scale(${enter})`,
          transformOrigin: "center bottom",
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontStyle: "italic",
          fontSize: 56,
          color: dark ? "#ffffff" : "#0a0a0a",
          textAlign: "center",
          maxWidth: Math.min(1100, width - 160),
          lineHeight: 1.5,
          marginBottom: 36,
          transform: `translateY(${translateY}px)`,
          wordBreak: "break-word",
        }}
      >
        {scene.text}
      </div>
      {scene.author && (
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 22,
            color: dark
              ? withAlpha("#ffffff", 0.65)
              : withAlpha("#000000", 0.65),
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            transform: `translateY(${translateY}px)`,
          }}
        >
          — {scene.author}
        </div>
      )}
    </AbsoluteFill>
  );
}

function ComparisonSceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: ComparisonScene;
  accentColor: string;
  backgroundColor: string;
}) {
  const { opacity, frame } = useSceneTransition();
  const { fps, width, height } = useVideoConfig();
  const dark = isDarkColor(backgroundColor);

  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 14,
  });
  const leftEnter = spring({
    frame: frame - 12,
    fps,
    config: { damping: 14, stiffness: 95 },
    durationInFrames: 18,
  });
  const rightEnter = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 95 },
    durationInFrames: 18,
  });

  const cardW = Math.min(540, (width - 240) / 2);
  const cardH = height * 0.55;

  const cardStyle = (active: number, fromX: number): CSSProperties => ({
    width: cardW,
    height: cardH,
    padding: "44px 40px",
    background: dark
      ? withAlpha("#ffffff", 0.05)
      : withAlpha("#000000", 0.04),
    border: `1px solid ${withAlpha(accentColor, 0.35)}`,
    borderRadius: 12,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    transform: `translateX(${interpolate(active, [0, 1], [fromX, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })}px)`,
    opacity: active,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 44,
          fontWeight: 800,
          color: dark ? "#ffffff" : "#0a0a0a",
          marginBottom: 40,
          textAlign: "center",
          opacity: titleEnter,
          transform: `translateY(${interpolate(titleEnter, [0, 1], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        {scene.title}
      </div>
      <div style={{ display: "flex", gap: 40, alignItems: "stretch" }}>
        <div style={cardStyle(leftEnter, -60)}>
          <div
            style={{
              display: "inline-block",
              padding: "5px 12px",
              background: withAlpha(accentColor, 0.18),
              color: accentColor,
              fontFamily: MONO_STACK,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              borderRadius: 4,
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            {scene.left.label}
          </div>
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 26,
              lineHeight: 1.55,
              color: dark
                ? withAlpha("#ffffff", 0.9)
                : withAlpha("#000000", 0.85),
              wordBreak: "break-word",
            }}
          >
            {scene.left.body}
          </div>
        </div>
        <div
          style={{
            width: 2,
            background: `linear-gradient(180deg, transparent, ${withAlpha(
              accentColor,
              0.5
            )} 50%, transparent)`,
            alignSelf: "stretch",
          }}
        />
        <div style={cardStyle(rightEnter, 60)}>
          <div
            style={{
              display: "inline-block",
              padding: "5px 12px",
              background: withAlpha(accentColor, 0.18),
              color: accentColor,
              fontFamily: MONO_STACK,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              borderRadius: 4,
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            {scene.right.label}
          </div>
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 26,
              lineHeight: 1.55,
              color: dark
                ? withAlpha("#ffffff", 0.9)
                : withAlpha("#000000", 0.85),
              wordBreak: "break-word",
            }}
          >
            {scene.right.body}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function OutroSceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: OutroScene;
  accentColor: string;
  backgroundColor: string;
}) {
  const { opacity, enter, translateY } = useSceneTransition();
  const { width } = useVideoConfig();
  const dark = isDarkColor(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "8px 18px",
          background: accentColor,
          color: isDarkColor(accentColor) ? "#ffffff" : "#0a0a0a",
          fontFamily: MONO_STACK,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "0.18em",
          borderRadius: 4,
          marginBottom: 36,
          textTransform: "uppercase",
          transform: `translateY(${translateY}px) scale(${enter})`,
        }}
      >
        Summary
      </div>
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 72,
          fontWeight: 900,
          color: dark ? "#ffffff" : "#0a0a0a",
          textAlign: "center",
          marginBottom: 32,
          maxWidth: width - 160,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          fontFamily: FONT_STACK,
          fontSize: 30,
          lineHeight: 1.6,
          color: dark
            ? withAlpha("#ffffff", 0.82)
            : withAlpha("#000000", 0.78),
          textAlign: "center",
          maxWidth: Math.min(1100, width - 200),
          wordBreak: "break-word",
          transform: `translateY(${translateY}px)`,
        }}
      >
        {scene.summary}
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════
// Scene dispatcher
// ════════════════════════════════════════════════════════════════════

function SceneRenderer({
  scene,
  accentColor,
  backgroundColor,
}: {
  scene: FreeformScene;
  accentColor: string;
  backgroundColor: string;
}) {
  switch (scene.kind) {
    case "title":
      return <TitleSceneRenderer scene={scene} accentColor={accentColor} />;
    case "definition":
      return (
        <DefinitionSceneRenderer
          scene={scene}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      );
    case "bullets":
      return (
        <BulletsSceneRenderer
          scene={scene}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      );
    case "formula":
      return (
        <FormulaSceneRenderer
          scene={scene}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      );
    case "callout":
      return (
        <CalloutSceneRenderer
          scene={scene}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      );
    case "quote":
      return (
        <QuoteSceneRenderer
          scene={scene}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      );
    case "comparison":
      return (
        <ComparisonSceneRenderer
          scene={scene}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      );
    case "outro":
      return (
        <OutroSceneRenderer
          scene={scene}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      );
    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════
// 主合成
// ════════════════════════════════════════════════════════════════════

export function FreeformSceneScript({
  scenes = freeformSceneScriptDefaultProps.scenes,
  accentColor = freeformSceneScriptDefaultProps.accentColor,
  backgroundColor = freeformSceneScriptDefaultProps.backgroundColor,
}: Partial<FreeformSceneScriptProps> = {}) {
  // 防御：空数组 / 非数组 时给一个最小可渲染场景
  const safeScenes: FreeformScene[] =
    Array.isArray(scenes) && scenes.length > 0
      ? scenes
      : freeformSceneScriptDefaultProps.scenes;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <BackgroundLayer
        accentColor={accentColor}
        backgroundColor={backgroundColor}
      />
      <Series>
        {safeScenes.map((scene, i) => (
          <Series.Sequence
            key={i}
            durationInFrames={Math.max(30, scene.durationFrames || 90)}
          >
            <SceneRenderer
              scene={scene}
              accentColor={accentColor}
              backgroundColor={backgroundColor}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
}
