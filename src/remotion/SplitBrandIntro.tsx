import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type SplitBrandIntroProps = {
  /** 左侧主词，例如频道名的前半 */
  prefix: string;
  /** 右侧高亮词，通常更短 */
  suffix: string;
  accentColor: string;
  backgroundColor: string;
};

const defaultProps: SplitBrandIntroProps = {
  prefix: "我的",
  suffix: "频道",
  accentColor: "#ff6700",
  backgroundColor: "#0a0a0a",
};

export const splitBrandIntroDefaultProps = defaultProps;

/**
 * 黑底 + 粗体分词 + 高亮色：适合作为片头或转场（文案与配色由 props 决定，请使用自有品牌内容）。
 */
export function SplitBrandIntro({
  prefix,
  suffix,
  accentColor,
  backgroundColor,
}: SplitBrandIntroProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const prefixProgress = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 100, mass: 0.9 },
  });

  const suffixProgress = spring({
    frame: frame - 8,
    fps,
    config: { damping: 11, stiffness: 95, mass: 0.85 },
  });

  const prefixScale = interpolate(prefixProgress, [0, 1], [0.88, 1]);
  const prefixOpacity = interpolate(prefixProgress, [0, 0.35, 1], [0, 1, 1]);

  const suffixY = interpolate(suffixProgress, [0, 1], [28, 0]);
  const suffixOpacity = interpolate(suffixProgress, [0, 0.4, 1], [0, 1, 1]);

  // Outro fade: starts 18 frames before end
  const outroStart = durationInFrames - 18;
  const outro = interpolate(frame, [outroStart, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        opacity: outro,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: "0.04em",
          fontFamily:
            'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
          fontWeight: 900,
          fontSize: Math.min(140, 720 * 0.18),
          letterSpacing: "-0.03em",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        <span
          style={{
            color: "#f5f5f5",
            transform: `scale(${prefixScale})`,
            opacity: prefixOpacity,
            transformOrigin: "left center",
          }}
        >
          {prefix}
        </span>
        <span
          style={{
            color: accentColor,
            transform: `translateY(${suffixY}px)`,
            opacity: suffixOpacity,
            textShadow: `0 0 48px ${accentColor}55`,
          }}
        >
          {suffix}
        </span>
      </div>
    </AbsoluteFill>
  );
}
