import { useCurrentFrame, interpolate } from "remotion";
import { ReactNode, CSSProperties } from "react";
import { AnimatedBackground } from "./AnimatedBackground";

/**
 * Shared dark scene container with animated background, fading header bar,
 * gradient underline, and smooth scene fade-in transition.
 */
export function SceneShell({
  title,
  children,
  padding = "44px 80px",
  showBackground = true,
}: {
  title: string;
  children: ReactNode;
  padding?: CSSProperties["padding"];
  showBackground?: boolean;
}) {
  const frame = useCurrentFrame();
  const sceneFade = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headerOpacity = interpolate(frame, [4, 22], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [8, 30], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0F172A",
        display: "flex",
        flexDirection: "column",
        padding,
        fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
        boxSizing: "border-box",
        position: "relative",
        opacity: sceneFade,
      }}
    >
      {showBackground && <AnimatedBackground />}

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div
          style={{
            opacity: headerOpacity,
            fontSize: 26,
            color: "#60A5FA",
            fontWeight: 700,
            letterSpacing: "3px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 4,
              height: 24,
              background: "linear-gradient(180deg,#3B82F6,#8B5CF6)",
              borderRadius: 2,
            }}
          />
          {title.toUpperCase()}
        </div>
        <div
          style={{
            width: `${lineWidth}%`,
            height: 2,
            background: "linear-gradient(90deg,#3B82F6,#8B5CF6,transparent)",
            marginBottom: 24,
            opacity: headerOpacity,
            transition: "width 0.3s",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
