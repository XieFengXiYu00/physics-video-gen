import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SPRINGS } from "@/lib/constants";
import { SceneShell } from "./SceneShell";

interface Step {
  stepNumber: number;
  description: string;
  equation?: string;
  result?: string;
}

interface SolutionStepProps {
  steps: Step[];
}

const SOLUTION_TARGET_TOTAL = 240;
const SOLUTION_PER_STEP_MIN = 28;

function SingleStep({ step, appearFrame }: { step: Step; appearFrame: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Skip rendering before this step is supposed to appear.
  if (frame < appearFrame) return null;

  const local = frame - appearFrame;

  const badgeScale = spring({ frame: local, fps, config: SPRINGS.STEP_BADGE });
  const descOpacity = interpolate(local, [8, 22], [0, 1], { extrapolateRight: "clamp" });
  const descY = interpolate(local, [8, 22], [18, 0], { extrapolateRight: "clamp" });
  const eqOpacity = interpolate(local, [18, 32], [0, 1], { extrapolateRight: "clamp" });
  const resOpacity = interpolate(local, [28, 42], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          transform: `scale(${badgeScale})`,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#6366F1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 800,
          color: "#fff",
          flexShrink: 0,
          boxShadow: "0 0 20px rgba(99,102,241,0.35)",
        }}
      >
        {step.stepNumber}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
            fontSize: 22,
            color: "#F1F5F9",
            fontWeight: 600,
            lineHeight: 1.5,
            marginBottom: step.equation ? 8 : 0,
          }}
        >
          {step.description}
        </div>

        {step.equation && (
          <div
            style={{
              opacity: eqOpacity,
              background: "rgba(30,64,175,0.2)",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: 10,
              padding: "8px 18px",
              fontSize: 20,
              color: "#A5B4FC",
              fontFamily: "monospace",
              display: "inline-block",
              marginBottom: step.result ? 6 : 0,
            }}
          >
            {step.equation}
          </div>
        )}

        {step.result && (
          <div
            style={{
              opacity: resOpacity,
              fontSize: 18,
              color: "#6EE7B7",
              fontFamily: "monospace",
              fontWeight: 600,
            }}
          >
            → {step.result}
          </div>
        )}
      </div>
    </div>
  );
}

export function SolutionStep({ steps }: SolutionStepProps) {
  const framesPerStep = Math.max(
    SOLUTION_PER_STEP_MIN,
    Math.floor(SOLUTION_TARGET_TOTAL / Math.max(steps.length, 1))
  );

  return (
    <SceneShell title="解题步骤">
      <div style={{ flex: 1, overflow: "hidden" }}>
        {steps.map((step, i) => (
          <SingleStep
            key={step.stepNumber}
            step={step}
            appearFrame={i * framesPerStep}
          />
        ))}
      </div>
    </SceneShell>
  );
}
