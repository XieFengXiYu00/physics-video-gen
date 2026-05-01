import { useCurrentFrame, interpolate } from "remotion";
import { ArrowConfig, ObjectConfig } from "@/types/scene";
import { DIAGRAM } from "@/lib/constants";
import { ForceArrow } from "./ForceArrow";
import { SceneShell } from "./SceneShell";

const { CANVAS_W, CANVAS_H } = DIAGRAM;

interface FreeBodyDiagramProps {
  title: string;
  objects: ObjectConfig[];
  arrows: ArrowConfig[];
}

// ─── SVG shape primitives for each object kind ───────────────────────────────

function HatchedSurface({
  x,
  y,
  width,
  spacing = 18,
}: {
  x: number;
  y: number;
  width: number;
  spacing?: number;
}) {
  const count = Math.max(1, Math.ceil(width / spacing));
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <line
          key={i}
          x1={x + i * spacing}
          y1={y}
          x2={x + i * spacing - 10}
          y2={y + 12}
          stroke="#64748B"
          strokeWidth={1.5}
        />
      ))}
    </>
  );
}

function ObjectLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text
      x={x}
      y={y}
      fill="#E2E8F0"
      fontSize={17}
      fontWeight="bold"
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}
    >
      {text}
    </text>
  );
}

function PhysicsObjectShape({ obj }: { obj: ObjectConfig }) {
  const cx = obj.x * CANVAS_W;
  const cy = obj.y * CANVAS_H;
  const w = obj.width * CANVAS_W;
  const h = obj.height * CANVAS_H;

  switch (obj.shape) {
    case "wedge": {
      const points = [
        `${cx - w / 2},${cy + h / 2}`,
        `${cx + w / 2},${cy + h / 2}`,
        `${cx + w / 2},${cy - h / 2}`,
      ].join(" ");
      return (
        <g>
          <polygon
            points={points}
            fill="rgba(100,116,139,0.55)"
            stroke="#94A3B8"
            strokeWidth={2}
          />
          <HatchedSurface x={cx - w / 2} y={cy + h / 2} width={w} />
          <ObjectLabel x={cx + w / 5} y={cy + h / 5} text={obj.label} />
        </g>
      );
    }
    case "surface":
      return (
        <g>
          <rect
            x={cx - w / 2}
            y={cy}
            width={w}
            height={h}
            fill="rgba(71,85,105,0.5)"
            stroke="#64748B"
            strokeWidth={2}
          />
          <HatchedSurface x={cx - w / 2} y={cy + h} width={w} spacing={20} />
        </g>
      );
    case "sphere":
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={w / 2}
            fill="rgba(30,64,175,0.6)"
            stroke="#60A5FA"
            strokeWidth={2}
          />
          <ObjectLabel x={cx} y={cy} text={obj.label} />
        </g>
      );
    case "block":
    default:
      return (
        <g>
          <rect
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            rx={6}
            fill="rgba(30,64,175,0.65)"
            stroke="#60A5FA"
            strokeWidth={2}
          />
          <ObjectLabel x={cx} y={cy} text={obj.label} />
        </g>
      );
  }
}

// ─── Faint grid (decorative) ─────────────────────────────────────────────────

function Grid() {
  const verticals = Math.floor(CANVAS_W / 100);
  const horizontals = Math.floor(CANVAS_H / 100);
  return (
    <>
      {Array.from({ length: verticals + 1 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={(i * CANVAS_W) / verticals}
          y1={0}
          x2={(i * CANVAS_W) / verticals}
          y2={CANVAS_H}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: horizontals + 1 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={(i * CANVAS_H) / horizontals}
          x2={CANVAS_W}
          y2={(i * CANVAS_H) / horizontals}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
        />
      ))}
    </>
  );
}

// ─── Main scene ──────────────────────────────────────────────────────────────

export function FreeBodyDiagram({ title, objects, arrows }: FreeBodyDiagramProps) {
  const frame = useCurrentFrame();

  const canvasOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateRight: "clamp",
  });
  const legendOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell title={title} padding="44px 64px">
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: canvasOpacity,
        }}
      >
        <div
          style={{
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: 18,
            padding: 16,
            boxShadow: "0 0 48px rgba(59,130,246,0.12)",
          }}
        >
          <svg
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          >
            <Grid />
            {objects.map((obj) => (
              <PhysicsObjectShape key={obj.id} obj={obj} />
            ))}
            {arrows.map((arrow, i) => (
              <ForceArrow
                key={i}
                {...arrow}
                index={i}
                canvasW={CANVAS_W}
                canvasH={CANVAS_H}
              />
            ))}
          </svg>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          justifyContent: "center",
          marginTop: 16,
          opacity: legendOpacity,
        }}
      >
        {arrows.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 18, height: 3, background: a.color, borderRadius: 2 }} />
            <span style={{ fontSize: 14, color: "#94A3B8" }}>{a.label}</span>
          </div>
        ))}
      </div>
    </SceneShell>
  );
}
