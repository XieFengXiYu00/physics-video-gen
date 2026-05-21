import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPRINGS } from "../../lib/constants";
import { AnimatedBackground } from "./AnimatedBackground";

interface AnswerSceneProps {
  answerText: string;
}

/** Deterministic pseudo-random */
function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Confetti-like particles that burst outward */
function CelebrationBurst() {
  const frame = useCurrentFrame();
  const particles = 20;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: particles }).map((_, i) => {
        const angle = (i / particles) * 360 + sr(i * 7) * 30;
        const rad = (angle * Math.PI) / 180;
        const speed = 2 + sr(i * 13) * 3;
        const delay = 10 + sr(i * 17) * 15;
        const elapsed = Math.max(0, frame - delay);
        const distance = elapsed * speed;
        const fadeOut = interpolate(elapsed, [0, 20, 50], [0, 1, 0], {
          extrapolateRight: "clamp",
        });
        const x = 50 + Math.cos(rad) * distance * 0.5;
        const y = 45 + Math.sin(rad) * distance * 0.5;
        const size = 4 + sr(i * 19) * 6;
        const hue = (i * 37) % 360;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: sr(i * 23) > 0.5 ? "50%" : 2,
              background: `hsl(${hue}, 80%, 65%)`,
              opacity: fadeOut * 0.8,
              transform: `rotate(${elapsed * (i % 2 === 0 ? 3 : -3)}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export function AnswerScene({ answerText }: AnswerSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneFade = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const checkScale = spring({ frame, fps, config: SPRINGS.CHECKMARK });
  const textOpacity = interpolate(frame, [22, 48], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [22, 48], [32, 0], {
    extrapolateRight: "clamp",
  });

  // Pulsing glow ring around checkmark
  const pulsePhase = frame % 60;
  const glowIntensity = interpolate(pulsePhase, [0, 30, 60], [0.4, 1, 0.4]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg,#064E3B,#065F46,#047857)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        position: "relative",
        opacity: sceneFade,
      }}
    >
      <AnimatedBackground variant="celebration" />
      <CelebrationBurst />

      {/* Pulsing glow ring */}
      <div
        style={{
          position: "relative",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(52,211,153,${0.15 * glowIntensity}) 0%, transparent 70%)`,
            filter: `blur(${8 * glowIntensity}px)`,
          }}
        />
        <div
          style={{
            transform: `scale(${checkScale})`,
            fontSize: 90,
            filter: `drop-shadow(0 0 ${20 * glowIntensity}px rgba(52,211,153,0.6))`,
            position: "relative",
          }}
        >
          ✓
        </div>
      </div>

      <div
        style={{
          fontSize: 30,
          color: "#6EE7B7",
          fontWeight: 700,
          letterSpacing: "4px",
          marginBottom: 24,
          position: "relative",
        }}
      >
        最终答案
      </div>

      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          background: "rgba(0,0,0,0.28)",
          border: "2px solid rgba(52,211,153,0.45)",
          borderRadius: 20,
          padding: "32px 60px",
          maxWidth: 880,
          textAlign: "center",
          fontSize: 30,
          color: "#ECFDF5",
          fontWeight: 700,
          lineHeight: 1.65,
          boxShadow: `0 0 ${30 * glowIntensity}px rgba(52,211,153,0.12), 0 16px 48px rgba(0,0,0,0.3)`,
          position: "relative",
        }}
      >
        {answerText}
      </div>
    </div>
  );
}
