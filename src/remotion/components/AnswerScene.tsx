import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPRINGS } from "@/lib/constants";

interface AnswerSceneProps {
  answerText: string;
}

export function AnswerScene({ answerText }: AnswerSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({ frame, fps, config: SPRINGS.CHECKMARK });
  const textOpacity = interpolate(frame, [22, 48], [0, 1], { extrapolateRight: "clamp" });
  const textY = interpolate(frame, [22, 48], [32, 0], { extrapolateRight: "clamp" });

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
      }}
    >
      <div
        style={{
          transform: `scale(${checkScale})`,
          fontSize: 90,
          marginBottom: 28,
          filter: "drop-shadow(0 0 20px rgba(52,211,153,0.6))",
        }}
      >
        ✓
      </div>

      <div
        style={{
          fontSize: 30,
          color: "#6EE7B7",
          fontWeight: 700,
          letterSpacing: "4px",
          marginBottom: 24,
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
        }}
      >
        {answerText}
      </div>
    </div>
  );
}
