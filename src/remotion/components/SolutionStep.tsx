import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SPRINGS } from "../../lib/constants";
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

/** Animated equation with character-by-character reveal */
function EquationReveal({
  text,
  startFrame,
}: {
  text: string;
  startFrame: number;
}) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charCount = Math.min(text.length, Math.floor(elapsed * 0.7));
  const displayed = text.substring(0, charCount);
  const glowPulse = interpolate(elapsed, [0, 15, 40], [0, 0.8, 0.4], {
    extrapolateRight: "clamp",
  });

  if (elapsed <= 0) return null;

  return (
    <div
      style={{
        background: "rgba(30,64,175,0.2)",
        border: "1px solid rgba(99,102,241,0.35)",
        borderRadius: 10,
        padding: "10px 20px",
        fontSize: 20,
        color: "#A5B4FC",
        fontFamily: "'Courier New', monospace",
        display: "inline-block",
        marginBottom: 6,
        boxShadow: `0 0 ${16 * glowPulse}px rgba(99,102,241,0.2)`,
        letterSpacing: 0.5,
      }}
    >
      {displayed}
      {charCount < text.length && (
        <span style={{ opacity: frame % 14 < 7 ? 0.5 : 0, color: "#818CF8" }}>
          _
        </span>
      )}
    </div>
  );
}

function SingleStep({ step, appearFrame }: { step: Step; appearFrame: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < appearFrame) return null;

  const local = frame - appearFrame;

  const badgeScale = spring({ frame: local, fps, config: SPRINGS.STEP_BADGE });
  const slideX = interpolate(local, [0, 16], [30, 0], { extrapolateRight: "clamp" });
  const descOpacity = interpolate(local, [6, 20], [0, 1], { extrapolateRight: "clamp" });
  const resOpacity = interpolate(local, [28, 42], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        padding: "18px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transform: `translateX(${slideX}px)`,
        opacity: interpolate(local, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {/* Step badge with glow */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div
          style={{
            transform: `scale(${badgeScale})`,
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#6366F1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
            boxShadow: "0 0 20px rgba(99,102,241,0.35), 0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {step.stepNumber}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {/* Description with animated underline */}
        <div
          style={{
            opacity: descOpacity,
            fontSize: 22,
            color: "#F1F5F9",
            fontWeight: 600,
            lineHeight: 1.5,
            marginBottom: step.equation ? 10 : 0,
          }}
        >
          {step.description}
        </div>

        {/* Equation with character reveal */}
        {step.equation && (
          <EquationReveal text={step.equation} startFrame={appearFrame + 14} />
        )}

        {/* Result with arrow indicator */}
        {step.result && (
          <div
            style={{
              opacity: resOpacity,
              fontSize: 18,
              color: "#6EE7B7",
              fontFamily: "'Courier New', monospace",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path
                d="M2 8h10M9 4l4 4-4 4"
                fill="none"
                stroke="#6EE7B7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {step.result}
          </div>
        )}
      </div>
    </div>
  );
}

export function SolutionStep({ steps }: SolutionStepProps) {
  const frame = useCurrentFrame();
  const framesPerStep = Math.max(
    SOLUTION_PER_STEP_MIN,
    Math.floor(SOLUTION_TARGET_TOTAL / Math.max(steps.length, 1))
  );

  // Progress indicator
  const totalSteps = steps.length;
  const currentStep = Math.min(
    totalSteps,
    Math.floor(frame / framesPerStep) + 1
  );

  return (
    <SceneShell title="解题步骤">
      {/* Progress indicator */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {steps.map((_, i) => {
          const isActive = i < currentStep;
          const isCurrent = i === currentStep - 1;
          return (
            <div
              key={i}
              style={{
                width: isCurrent ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: isActive
                  ? "linear-gradient(90deg, #3B82F6, #6366F1)"
                  : "rgba(255,255,255,0.1)",
                transition: "all 0.3s",
                boxShadow: isCurrent
                  ? "0 0 12px rgba(99,102,241,0.5)"
                  : "none",
              }}
            />
          );
        })}
        <span
          style={{
            marginLeft: 8,
            fontSize: 13,
            color: "#64748B",
            fontWeight: 600,
          }}
        >
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Steps */}
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
