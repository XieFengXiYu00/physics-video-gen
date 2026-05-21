import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type CountdownTimerProps = {
  /** 倒计时起始数字 (3-10) */
  countFrom: number;
  /** 倒计时结束后的标题文字 */
  title: string;
  /** 主题色 */
  accentColor: string;
  /** 背景色 */
  backgroundColor: string;
};

const defaultProps: CountdownTimerProps = {
  countFrom: 3,
  title: "GO!",
  accentColor: "#f97316",
  backgroundColor: "#0a0a0a",
};

export const countdownDefaultProps = defaultProps;

/**
 * 倒计时动画：数字缩放弹入 + 圆环进度条 + 结束爆炸标题。
 * 适合视频开场、直播倒计时、发布预告。
 */
export function CountdownTimer({
  countFrom,
  title,
  accentColor,
  backgroundColor,
}: CountdownTimerProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const safeCount = Math.max(1, Math.min(10, countFrom));
  const framesPerCount = fps; // 1 second per number
  const countdownFrames = safeCount * framesPerCount;

  // Current count number (countFrom → 1 → title)
  const countIndex = Math.floor(frame / framesPerCount);
  const currentNumber = safeCount - countIndex;
  const inCountdown = frame < countdownFrames;
  const localFrame = frame % framesPerCount;

  // Number animation: spring scale + fade
  const numSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, stiffness: 160, mass: 0.7 },
  });
  const numScale = interpolate(numSpring, [0, 1], [2.5, 1]);
  const numOpacity = interpolate(localFrame, [0, 4, fps - 6, fps - 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress ring
  const overallProgress = Math.min(1, frame / countdownFrames);
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - overallProgress);

  // Title animation after countdown
  const titleSpring = spring({
    frame: frame - countdownFrames,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.6 },
  });
  const titleScale = interpolate(titleSpring, [0, 1], [0.3, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 0.3, 1], [0, 1, 1]);

  // Outro fade
  const outroStart = durationInFrames - 15;
  const outro = interpolate(frame, [outroStart, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse ring effect
  const pulseScale = inCountdown
    ? 1 + Math.sin(localFrame * 0.2) * 0.03
    : 1;

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
      {/* Radial gradient backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, ${accentColor}15 0%, transparent 65%)`,
        }}
      />

      {/* Progress ring */}
      <svg
        width={320}
        height={320}
        style={{
          position: "absolute",
          transform: `scale(${pulseScale})`,
        }}
      >
        {/* Background ring */}
        <circle
          cx={160}
          cy={160}
          r={140}
          fill="none"
          stroke={`${accentColor}22`}
          strokeWidth={6}
        />
        {/* Progress ring */}
        <circle
          cx={160}
          cy={160}
          r={140}
          fill="none"
          stroke={accentColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 160 160)"
          style={{
            filter: `drop-shadow(0 0 12px ${accentColor})`,
          }}
        />
      </svg>

      {/* Number or Title */}
      {inCountdown ? (
        <div
          style={{
            position: "absolute",
            fontSize: 140,
            fontWeight: 800,
            color: "#f0f0f0",
            fontFamily:
              'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
            transform: `scale(${numScale})`,
            opacity: numOpacity,
            textShadow: `0 0 40px ${accentColor}66`,
            userSelect: "none",
          }}
        >
          {currentNumber > 0 ? currentNumber : ""}
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            fontSize: 100,
            fontWeight: 900,
            color: accentColor,
            fontFamily:
              'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            textShadow: `0 0 60px ${accentColor}88`,
            letterSpacing: "0.05em",
            userSelect: "none",
          }}
        >
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
}
