import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TypewriterTextProps = {
  /** 打字显示的主标题文字 */
  text: string;
  /** 副标题，打字完成后淡入 */
  subtitle: string;
  /** 光标颜色 */
  accentColor: string;
  /** 背景色 */
  backgroundColor: string;
};

const defaultProps: TypewriterTextProps = {
  text: "Hello World",
  subtitle: "欢迎来到我的频道",
  accentColor: "#22d3ee",
  backgroundColor: "#0a0a0a",
};

export const typewriterDefaultProps = defaultProps;

/**
 * 打字机效果：逐字显示标题文字 + 闪烁光标 + 副标题淡入，
 * 适合知识类/编程类博主片头或字幕卡。
 */
export function TypewriterText({
  text,
  subtitle,
  accentColor,
  backgroundColor,
}: TypewriterTextProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Typing speed: reveal one character every N frames
  const charsPerFrame = 0.12;
  const totalChars = text.length;
  const visibleChars = Math.min(totalChars, Math.floor(frame * charsPerFrame));
  const typingDone = visibleChars >= totalChars;
  const typingDoneFrame = Math.ceil(totalChars / charsPerFrame);

  // Cursor blink: 0.5s cycle
  const cursorVisible = Math.floor(frame / (fps * 0.5)) % 2 === 0 || !typingDone;

  // Subtitle fade in after typing completes
  const subtitleDelay = typingDoneFrame + 15;
  const subtitleProgress = spring({
    frame: frame - subtitleDelay,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [20, 0]);

  // Outro fade
  const outroStart = durationInFrames - 20;
  const outro = interpolate(frame, [outroStart, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scanline overlay
  const scanY = (frame * 2.5) % 800;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        opacity: outro,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        overflow: "hidden",
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Scanline */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: scanY,
          width: "100%",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}33, transparent)`,
          pointerEvents: "none",
        }}
      />

      {/* Main text */}
      <div style={{ textAlign: "center", zIndex: 1, padding: "0 60px" }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f0f0f0",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            display: "inline",
          }}
        >
          {text.slice(0, visibleChars)}
          <span
            style={{
              display: "inline-block",
              width: 4,
              height: "0.85em",
              backgroundColor: cursorVisible ? accentColor : "transparent",
              marginLeft: 4,
              verticalAlign: "baseline",
              boxShadow: cursorVisible ? `0 0 12px ${accentColor}88` : "none",
            }}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            fontWeight: 400,
            color: accentColor,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            letterSpacing: "0.15em",
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
