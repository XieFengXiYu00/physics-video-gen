import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type MinimalQuoteProps = {
  /** 引言正文 */
  quote: string;
  /** 引言作者 */
  author: string;
  /** 装饰线和引号颜色 */
  accentColor: string;
  /** 背景色 */
  backgroundColor: string;
};

const defaultProps: MinimalQuoteProps = {
  quote: "简约是终极的复杂。",
  author: "达·芬奇",
  accentColor: "#facc15",
  backgroundColor: "#fafaf9",
};

export const minimalQuoteDefaultProps = defaultProps;

/**
 * 简约引言卡片：大引号装饰 + 逐行淡入文字 + 作者签名 + 装饰线。
 * 适合金句分享、读书笔记、心灵鸡汤类短视频。
 */
export function MinimalQuote({
  quote,
  author,
  accentColor,
  backgroundColor,
}: MinimalQuoteProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Detect if background is dark or light for text color
  const bgHex = backgroundColor.replace("#", "");
  const r = parseInt(bgHex.substring(0, 2), 16) || 0;
  const g = parseInt(bgHex.substring(2, 4), 16) || 0;
  const b = parseInt(bgHex.substring(4, 6), 16) || 0;
  const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
  const textColor = isDark ? "#f5f5f4" : "#1c1917";
  const mutedColor = isDark ? "#a8a29e" : "#78716c";

  // Quote mark entrance
  const quoteMarkSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 90, mass: 1.2 },
  });
  const quoteMarkScale = interpolate(quoteMarkSpring, [0, 1], [0.5, 1]);
  const quoteMarkOpacity = interpolate(quoteMarkSpring, [0, 0.3, 1], [0, 0.2, 0.2]);

  // Decorative line
  const lineSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.8 },
  });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 80]);

  // Text entrance
  const textSpring = spring({
    frame: frame - 12,
    fps,
    config: { damping: 14, stiffness: 70, mass: 1 },
  });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [30, 0]);

  // Author entrance
  const authorSpring = spring({
    frame: frame - 35,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.9 },
  });
  const authorOpacity = interpolate(authorSpring, [0, 1], [0, 1]);
  const authorX = interpolate(authorSpring, [0, 1], [-20, 0]);

  // Outro
  const outroStart = durationInFrames - 20;
  const outro = interpolate(frame, [outroStart, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        opacity: outro,
        overflow: "hidden",
      }}
    >
      {/* Large decorative quote mark */}
      <div
        style={{
          position: "absolute",
          fontSize: 320,
          fontFamily: "Georgia, serif",
          color: accentColor,
          opacity: quoteMarkOpacity,
          transform: `scale(${quoteMarkScale})`,
          top: 60,
          left: 80,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        &ldquo;
      </div>

      {/* Content */}
      <div
        style={{
          textAlign: "center",
          zIndex: 1,
          padding: "0 100px",
          maxWidth: 900,
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            backgroundColor: accentColor,
            margin: "0 auto 32px",
            borderRadius: 2,
          }}
        />

        {/* Quote text */}
        <div
          style={{
            fontSize: 42,
            fontWeight: 600,
            color: textColor,
            lineHeight: 1.6,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            fontFamily:
              'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            letterSpacing: "0.01em",
          }}
        >
          {quote}
        </div>

        {/* Author */}
        <div
          style={{
            marginTop: 36,
            fontSize: 20,
            fontWeight: 500,
            color: mutedColor,
            opacity: authorOpacity,
            transform: `translateX(${authorX}px)`,
            fontFamily:
              'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
            letterSpacing: "0.12em",
          }}
        >
          — {author}
        </div>
      </div>
    </AbsoluteFill>
  );
}
