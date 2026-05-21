import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type NeonTitleProps = {
  /** 主标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 霓虹灯颜色 */
  accentColor: string;
  /** 背景色 */
  backgroundColor: string;
};

const defaultProps: NeonTitleProps = {
  title: "NEON",
  subtitle: "霓虹灯效果",
  accentColor: "#e879f9",
  backgroundColor: "#09090b",
};

export const neonTitleDefaultProps = defaultProps;

function rnd(frame: number, salt: number): number {
  const x = Math.sin(frame * 0.971 + salt * 12.989) * 43758.545;
  return x - Math.floor(x);
}

/**
 * 霓虹灯标题：文字以霓虹发光效果闪烁登场，带砖墙纹理背景。
 * 适合夜市/酒吧/潮流/电竞风格的频道片头。
 */
export function NeonTitle({
  title,
  subtitle,
  accentColor,
  backgroundColor,
}: NeonTitleProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Neon flicker: mostly on, occasional brief off
  const flickerSeed = rnd(frame, 7);
  const flickerSeed2 = rnd(frame - 1, 7);
  const isFlickering = frame > 10 && frame < 35;
  const flickerOff = isFlickering && flickerSeed > 0.7 && flickerSeed2 < 0.6;
  const glowIntensity = flickerOff ? 0.15 : 1;

  // Title entrance
  const titleSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 90, mass: 1 },
  });
  const titleOpacity = interpolate(titleSpring, [0, 0.3, 1], [0, 0.8, 1]) * glowIntensity;

  // Subtitle entrance
  const subSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.9 },
  });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 0.9]);
  const subY = interpolate(subSpring, [0, 1], [16, 0]);

  // Neon glow layers
  const glow1 = `0 0 7px ${accentColor}`;
  const glow2 = `0 0 20px ${accentColor}cc`;
  const glow3 = `0 0 42px ${accentColor}88`;
  const glow4 = `0 0 82px ${accentColor}44`;
  const textShadow = flickerOff
    ? `0 0 4px ${accentColor}33`
    : `${glow1}, ${glow2}, ${glow3}, ${glow4}`;

  // Sub-glow
  const subGlow = `0 0 8px ${accentColor}88, 0 0 24px ${accentColor}44`;

  // Outro fade
  const outroStart = durationInFrames - 18;
  const outro = interpolate(frame, [outroStart, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ambient light reflection on "wall"
  const ambientOpacity = flickerOff ? 0.02 : 0.12;

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
      {/* Brick wall texture (CSS pattern) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage: `
            linear-gradient(335deg, #b5b5b522 23px, transparent 23px),
            linear-gradient(155deg, #b5b5b522 23px, transparent 23px),
            linear-gradient(335deg, #b5b5b522 23px, transparent 23px),
            linear-gradient(155deg, #b5b5b522 23px, transparent 23px)
          `,
          backgroundSize: "58px 58px",
          backgroundPosition: "0px 2px, 4px 35px, 29px 31px, 33px 6px",
        }}
      />

      {/* Ambient colored light cast on wall */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${accentColor}${Math.round(ambientOpacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div style={{ textAlign: "center", zIndex: 1, padding: "0 48px" }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: flickerOff ? `${accentColor}55` : accentColor,
            fontFamily:
              'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
            textShadow,
            opacity: titleOpacity,
            letterSpacing: "0.08em",
            lineHeight: 1.1,
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            fontWeight: 500,
            color: `${accentColor}dd`,
            textShadow: subGlow,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            letterSpacing: "0.25em",
            fontFamily:
              'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
