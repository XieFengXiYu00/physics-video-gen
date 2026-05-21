import { useCurrentFrame, interpolate } from "remotion";

/** Deterministic pseudo-random from seed (no Math.random — Remotion needs purity) */
function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

interface Dot {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const DOTS: Dot[] = Array.from({ length: 28 }, (_, i) => ({
  x: sr(i * 7 + 1) * 100,
  y: sr(i * 13 + 3) * 100,
  size: 2 + sr(i * 17 + 5) * 3,
  speed: 0.12 + sr(i * 23 + 7) * 0.28,
  opacity: 0.06 + sr(i * 29 + 11) * 0.14,
}));

const SYMBOLS = ["∫", "Σ", "π", "∂", "√", "∞", "Δ", "θ", "λ", "∇"];
const SYM_DATA = SYMBOLS.slice(0, 8).map((sym, i) => ({
  sym,
  x: sr(i * 37 + 2) * 90 + 5,
  y: sr(i * 41 + 4) * 80 + 10,
  size: 18 + sr(i * 43 + 6) * 16,
  speed: 0.035 + sr(i * 47 + 8) * 0.055,
  rot: (i % 2 === 0 ? 1 : -1) * (0.25 + sr(i * 53) * 0.35),
}));

/**
 * Floating particles + math symbols behind scene content.
 * Pure component — only depends on useCurrentFrame().
 */
export function AnimatedBackground({
  variant = "default",
}: {
  variant?: "default" | "celebration";
}) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: fadeIn,
      }}
    >
      {/* Floating dots */}
      {DOTS.map((d, i) => {
        const y = ((d.y - frame * d.speed) % 108 + 108) % 108 - 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${d.x}%`,
              top: `${y}%`,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background:
                variant === "celebration"
                  ? `hsl(${(i * 47) % 360}, 70%, 65%)`
                  : "rgba(96, 165, 250, 0.8)",
              opacity: d.opacity,
            }}
          />
        );
      })}

      {/* Floating math symbols */}
      {SYM_DATA.map((s, i) => {
        const y = ((s.y - frame * s.speed) % 112 + 112) % 112 - 6;
        return (
          <div
            key={`s-${i}`}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${y}%`,
              fontSize: s.size,
              color:
                variant === "celebration"
                  ? `hsla(${(i * 51) % 360}, 60%, 70%, 0.1)`
                  : "rgba(148, 163, 184, 0.06)",
              fontFamily: "serif",
              transform: `rotate(${frame * s.rot}deg)`,
              userSelect: "none",
            }}
          >
            {s.sym}
          </div>
        );
      })}

      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          width: 600,
          height: 600,
          transform: "translate(-50%, -50%)",
          background:
            variant === "celebration"
              ? "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
          opacity: interpolate(frame, [10, 40], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </div>
  );
}
