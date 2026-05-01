import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPRINGS } from "@/lib/constants";

interface ProblemSceneProps {
  title: string;
  subtitle: string;
  given: Record<string, string>;
}

export function ProblemScene({ title, subtitle, given }: ProblemSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: SPRINGS.TITLE });
  const subtitleOpacity = interpolate(frame, [18, 36], [0, 1], { extrapolateRight: "clamp" });
  const lineScale = interpolate(frame, [24, 48], [0, 1], { extrapolateRight: "clamp" });
  const givenOpacity = interpolate(frame, [36, 56], [0, 1], { extrapolateRight: "clamp" });
  const givenY = interpolate(frame, [36, 56], [24, 0], { extrapolateRight: "clamp" });

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
      }}
    >
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
        }}
      />

      <div style={{ opacity: subtitleOpacity, fontSize: 26, color: "#93C5FD", marginBottom: 36 }}>
        {subtitle}
      </div>

      <div
        style={{
          opacity: givenOpacity,
          transform: `translateY(${givenY}px)`,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          maxWidth: 860,
        }}
      >
        {Object.entries(given).map(([k, v]) => (
          <div
            key={k}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 12,
              padding: "12px 24px",
            }}
          >
            <span style={{ color: "#93C5FD", fontSize: 16 }}>{k} = </span>
            <span style={{ color: "#FFF", fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
