import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRINGS } from "@/lib/constants";
import { StoryboardAction, StoryboardGroupConfig } from "@/types/scene";
import { SceneShell } from "./SceneShell";

interface StoryboardSceneProps {
  title: string;
  narration: string;
  visualAction: StoryboardAction;
  equation?: string;
  highlights?: string[];
  groups?: StoryboardGroupConfig[];
}

const ACTION_LABELS: Record<StoryboardAction, string> = {
  show_items: "展示条件",
  show_equation: "列式计算",
  distribute_items: "分组构造",
  compare_cases: "排除尝试",
  highlight_answer: "锁定答案",
  explain: "关键解释",
};

function HighlightChips({ highlights = [] }: { highlights?: string[] }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
      {highlights.slice(0, 8).map((h, i) => {
        const opacity = interpolate(frame, [18 + i * 6, 30 + i * 6], [0, 1], {
          extrapolateRight: "clamp",
        });
        const y = interpolate(frame, [18 + i * 6, 30 + i * 6], [12, 0], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={`${h}-${i}`}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              padding: "10px 16px",
              borderRadius: 999,
              background: "rgba(96,165,250,0.16)",
              border: "1px solid rgba(147,197,253,0.35)",
              color: "#BFDBFE",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {h}
          </div>
        );
      })}
    </div>
  );
}

function GroupCard({ group, index }: { group: StoryboardGroupConfig; index: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [28 + index * 7, 44 + index * 7], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [28 + index * 7, 44 + index * 7], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        background: "rgba(15,23,42,0.72)",
        border: "1px solid rgba(148,163,184,0.25)",
        borderRadius: 18,
        padding: 18,
        minHeight: 136,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ color: "#93C5FD", fontSize: 22, fontWeight: 800 }}>
        {group.label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {group.items.slice(0, 8).map((item, i) => (
          <div
            key={`${item}-${i}`}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "linear-gradient(135deg,#1D4ED8,#7C3AED)",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {item}
          </div>
        ))}
      </div>
      {group.sum && (
        <div style={{ marginTop: "auto", color: "#6EE7B7", fontSize: 24, fontWeight: 900 }}>
          合计：{group.sum}
        </div>
      )}
    </div>
  );
}

export function StoryboardScene({
  title,
  narration,
  visualAction,
  equation,
  highlights,
  groups,
}: StoryboardSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: SPRINGS.TITLE });
  const narrationOpacity = interpolate(frame, [10, 28], [0, 1], {
    extrapolateRight: "clamp",
  });
  const equationOpacity = interpolate(frame, [24, 42], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell title={ACTION_LABELS[visualAction] ?? "分镜讲解"}>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: groups?.length ? "0.9fr 1.1fr" : "1fr",
          gap: 28,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at top left,rgba(59,130,246,0.28),rgba(15,23,42,0.82))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 34,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
          }}
        >
          <div
            style={{
              transform: `scale(${titleScale})`,
              transformOrigin: "left center",
              color: "#F8FAFC",
              fontSize: 42,
              lineHeight: 1.25,
              fontWeight: 900,
              marginBottom: 24,
            }}
          >
            {title}
          </div>
          <div
            style={{
              opacity: narrationOpacity,
              color: "#CBD5E1",
              fontSize: 26,
              lineHeight: 1.55,
              fontWeight: 600,
            }}
          >
            {narration}
          </div>
          {equation && (
            <div
              style={{
                opacity: equationOpacity,
                marginTop: 28,
                display: "inline-block",
                alignSelf: "flex-start",
                color: "#FDE68A",
                background: "rgba(120,53,15,0.26)",
                border: "1px solid rgba(251,191,36,0.34)",
                borderRadius: 14,
                padding: "14px 20px",
                fontSize: 27,
                fontFamily: "monospace",
                fontWeight: 800,
              }}
            >
              {equation}
            </div>
          )}
          <HighlightChips highlights={highlights} />
        </div>

        {groups?.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: groups.length > 3 ? "1fr 1fr" : "1fr",
              gap: 14,
              alignContent: "center",
            }}
          >
            {groups.slice(0, 6).map((group, i) => (
              <GroupCard key={`${group.label}-${i}`} group={group} index={i} />
            ))}
          </div>
        ) : null}
      </div>
    </SceneShell>
  );
}
