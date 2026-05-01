import { useCurrentFrame, interpolate } from "remotion";
import { ReactNode, CSSProperties } from "react";

/**
 * Shared dark scene container with a fading header bar and gradient underline.
 * Used by FreeBodyDiagram and SolutionStep so layout stays consistent.
 */
export function SceneShell({
  title,
  children,
  padding = "44px 80px",
}: {
  title: string;
  children: ReactNode;
  padding?: CSSProperties["padding"];
}) {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 18], [0, 1], {
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
      }}
    >
      <div
        style={{
          opacity: headerOpacity,
          fontSize: 26,
          color: "#60A5FA",
          fontWeight: 700,
          letterSpacing: "3px",
          marginBottom: 12,
        }}
      >
        {title.toUpperCase()}
      </div>
      <div
        style={{
          width: "100%",
          height: 2,
          background: "linear-gradient(90deg,#3B82F6,transparent)",
          marginBottom: 24,
          opacity: headerOpacity,
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}
