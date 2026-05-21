import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPRINGS } from "../../lib/constants";
import { AnimatedBackground } from "./AnimatedBackground";

interface ProblemSceneProps {
  title: string;
  subtitle: string;
  given: Record<string, string>;
}

export function ProblemScene({ title, subtitle, given }: ProblemSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneFade = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleScale = spring({ frame, fps, config: SPRINGS.TITLE });
  const subtitleOpacity = interpolate(frame, [18, 36], [0, 1], { extrapolateRight: "clamp" });
  const lineScale = interpolate(frame, [24, 48], [0, 1], { extrapolateRight: "clamp" });

  const givenEntries = Object.entries(given);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 55%,#1E40AF 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        padding: "60px 80px",
        boxSizing: "border-box",
        position: "relative",
        opacity: sceneFade,
      }}
    >
      <AnimatedBackground />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${titleScale})`,
            fontSize: 52,
            fontWeight: 800,
            color: "#FFF",
            textAlign: "center",
            lineHeight: 1.3,
            textShadow: "0 4px 20px rgba(0,0,0,0.4)",
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        <div
          style={{
            width: 100,
            height: 4,
            background: "linear-gradient(90deg,#60A5FA,#A78BFA)",
            borderRadius: 2,
            margin: "28px 0",
            transform: `scaleX(${lineScale})`,
            transformOrigin: "center",
            boxShadow: `0 0 ${12 * lineScale}px rgba(96,165,250,0.3)`,
          }}
        />

        <div style={{ opacity: subtitleOpacity, fontSize: 26, color: "#93C5FD", marginBottom: 36 }}>
          {subtitle}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
            maxWidth: 860,
          }}
        >
          {givenEntries.map(([k, v], i) => {
            const cardDelay = 40 + i * 6;
            const cardProgress = spring({
              frame: Math.max(0, frame - cardDelay),
              fps,
              config: { damping: 12, stiffness: 100 },
            });
            const cardScale = interpolate(cardProgress, [0, 1], [0.7, 1]);

            return (
              <div
                key={k}
                style={{
                  opacity: cardProgress,
                  transform: `scale(${cardScale})`,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  padding: "12px 24px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                <span style={{ color: "#93C5FD", fontSize: 16 }}>{k} = </span>
                <span style={{ color: "#FFF", fontSize: 22, fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                  {v}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
