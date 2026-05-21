import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ParticleWaveTitleProps = {
  /** 主标题 */
  title: string;
  /** 副标题 / 描述 */
  subtitle: string;
  /** 粒子和高亮色 */
  accentColor: string;
  /** 背景色 */
  backgroundColor: string;
};

const defaultProps: ParticleWaveTitleProps = {
  title: "AI FUTURE",
  subtitle: "探索人工智能的无限可能",
  accentColor: "#3b82f6",
  backgroundColor: "#030712",
};

export const particleWaveDefaultProps = defaultProps;

function rnd(frame: number, salt: number): number {
  const x = Math.sin(frame * 0.413 + salt * 19.127) * 10000;
  return x - Math.floor(x);
}

/**
 * 粒子波浪标题：底部粒子以正弦波浮动 + 连线效果 + 标题弹入。
 * 适合科技/AI/数据相关主题的视频片头。
 */
export function ParticleWaveTitle({
  title,
  subtitle,
  accentColor,
  backgroundColor,
}: ParticleWaveTitleProps) {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Generate particles
  const particleCount = 60;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const baseX = rnd(0, i * 3) * width;
    const baseY = height * 0.55 + rnd(0, i * 7) * (height * 0.4);
    const speed = 0.3 + rnd(0, i * 11) * 0.7;
    const amplitude = 15 + rnd(0, i * 13) * 30;
    const phase = rnd(0, i * 17) * Math.PI * 2;
    const size = 2 + rnd(0, i * 19) * 3;

    const x = baseX + Math.sin(frame * 0.02 * speed + phase) * 30;
    const y = baseY + Math.sin(frame * 0.035 * speed + phase) * amplitude;

    return { x, y, size, i };
  });

  // Title animation
  const titleSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 11, stiffness: 100, mass: 0.9 },
  });
  const titleScale = interpolate(titleSpring, [0, 1], [0.85, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 0.35, 1], [0, 1, 1]);

  // Subtitle
  const subSpring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.85 },
  });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);
  const subY = interpolate(subSpring, [0, 1], [18, 0]);

  // Top glow line
  const lineSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.7 },
  });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 200]);

  // Outro
  const outroStart = durationInFrames - 18;
  const outro = interpolate(frame, [outroStart, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Particle entrance stagger
  const particleEntrance = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        opacity: outro,
        overflow: "hidden",
      }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 50% at 50% 30%, ${accentColor}18 0%, transparent 70%)`,
        }}
      />

      {/* Particles */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, opacity: particleEntrance * 0.7 }}
      >
        {/* Connection lines between nearby particles */}
        {particles.map((p, i) => {
          const lines: React.ReactNode[] = [];
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              const lineOpacity = interpolate(dist, [0, 120], [0.3, 0], {
                extrapolateRight: "clamp",
              });
              lines.push(
                <line
                  key={`${i}-${j}`}
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  stroke={accentColor}
                  strokeWidth={0.8}
                  strokeOpacity={lineOpacity}
                />
              );
            }
          }
          return lines;
        })}

        {/* Particle dots */}
        {particles.map((p) => (
          <circle
            key={p.i}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={accentColor}
            opacity={0.4 + rnd(frame, p.i + 500) * 0.4}
          />
        ))}
      </svg>

      {/* Text content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2,
          padding: "0 60px",
        }}
      >
        {/* Glow line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            marginBottom: 28,
            borderRadius: 1,
            boxShadow: `0 0 16px ${accentColor}66`,
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#f0f0f0",
            fontFamily:
              'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textShadow: `0 0 40px ${accentColor}44`,
            textAlign: "center",
            lineHeight: 1.1,
            userSelect: "none",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 22,
            fontSize: 24,
            fontWeight: 400,
            color: `${accentColor}cc`,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            letterSpacing: "0.18em",
            fontFamily:
              'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
