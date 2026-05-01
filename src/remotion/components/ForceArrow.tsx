import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ArrowConfig } from "@/types/scene";
import { DIAGRAM, SPRINGS } from "@/lib/constants";

interface ForceArrowProps extends ArrowConfig {
  index: number;
  canvasW: number;
  canvasH: number;
}

export function ForceArrow({
  fromX,
  fromY,
  angle_deg,
  length,
  color,
  label,
  magnitude,
  index,
  canvasW,
  canvasH,
}: ForceArrowProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stagger reveal so arrows appear one by one
  const delay = index * DIAGRAM.ARROW_STAGGER_FRAMES;
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SPRINGS.ARROW,
  });

  const ox = fromX * canvasW;
  const oy = fromY * canvasH;
  const rad = (angle_deg * Math.PI) / 180;
  const dx = Math.cos(rad) * length * progress;
  const dy = -Math.sin(rad) * length * progress; // SVG y is inverted

  const tx = ox + dx;
  const ty = oy + dy;

  // Arrowhead geometry — angle taken from the *fully extended* direction so
  // the head doesn't wobble during the spring overshoot
  const fullDx = Math.cos(rad);
  const fullDy = -Math.sin(rad);
  const arrowAngle = Math.atan2(fullDy, fullDx);
  const { ARROW_HEAD_LENGTH: headLen, ARROW_HEAD_SPREAD: spread } = DIAGRAM;
  const hx1 = tx - headLen * Math.cos(arrowAngle - spread);
  const hy1 = ty - headLen * Math.sin(arrowAngle - spread);
  const hx2 = tx - headLen * Math.cos(arrowAngle + spread);
  const hy2 = ty - headLen * Math.sin(arrowAngle + spread);

  // Label sits past the arrowhead along the same direction
  const lx = tx + DIAGRAM.ARROW_LABEL_OFFSET * fullDx;
  const ly = ty + DIAGRAM.ARROW_LABEL_OFFSET * fullDy;

  const labelOpacity = Math.max(0, (progress - 0.6) / 0.4);

  return (
    <g>
      <line
        x1={ox}
        y1={oy}
        x2={tx}
        y2={ty}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {progress > 0.05 && (
        <polygon
          points={`${tx},${ty} ${hx1},${hy1} ${hx2},${hy2}`}
          fill={color}
        />
      )}
      <text
        x={lx}
        y={ly - 8}
        fill={color}
        fontSize={15}
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        opacity={labelOpacity}
        style={{ fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}
      >
        {label}
      </text>
      <text
        x={lx}
        y={ly + 10}
        fill={color}
        fontSize={12}
        textAnchor="middle"
        dominantBaseline="middle"
        opacity={labelOpacity}
        style={{ fontFamily: "monospace" }}
      >
        {magnitude}
      </text>
    </g>
  );
}
