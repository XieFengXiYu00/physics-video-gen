import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRINGS } from "../../lib/constants";
import {
  StoryboardAction,
  StoryboardCaptionStyle,
  StoryboardEntityPositionConfig,
  StoryboardGroupConfig,
  StoryboardLayoutType,
  StoryboardPanelStyle,
  StoryboardVisualPriority,
} from "../../types/scene";
import { SceneShell } from "./SceneShell";

interface StoryboardSceneProps {
  title: string;
  narration: string;
  visualAction: StoryboardAction;
  equation?: string;
  highlights?: string[];
  groups?: StoryboardGroupConfig[];
  layoutType?: StoryboardLayoutType;
  visualPriority?: StoryboardVisualPriority;
  entityPositions?: StoryboardEntityPositionConfig[];
  panelStyle?: StoryboardPanelStyle;
  emphasisTarget?: string;
  animationCue?: string;
  captionStyle?: StoryboardCaptionStyle;
}

const ACTION_LABELS: Record<StoryboardAction, string> = {
  show_items: "展示条件",
  show_equation: "列式计算",
  distribute_items: "分组构造",
  compare_cases: "排除尝试",
  highlight_answer: "锁定答案",
  explain: "关键解释",
};

// ─── Background gradients per action type ─────────────────────────────────────

const ACTION_GRADIENTS: Record<StoryboardAction, string> = {
  show_items: "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.18) 0%, transparent 65%)",
  show_equation: "radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.2) 0%, transparent 60%)",
  distribute_items: "radial-gradient(ellipse at 70% 30%, rgba(16,185,129,0.18) 0%, transparent 65%)",
  compare_cases: "radial-gradient(ellipse at 40% 60%, rgba(245,158,11,0.15) 0%, transparent 65%)",
  highlight_answer: "radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.22) 0%, transparent 55%)",
  explain: "radial-gradient(ellipse at 60% 50%, rgba(96,165,250,0.16) 0%, transparent 60%)",
};

function getPanelStyle(panelStyle: StoryboardPanelStyle | undefined, action: StoryboardAction) {
  switch (panelStyle) {
    case "flat":
      return {
        background: "rgba(15,23,42,0.86)",
        border: "1px solid rgba(148,163,184,0.14)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
      };
    case "spotlight":
      return {
        background: ACTION_GRADIENTS[action],
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.28)",
      };
    case "board":
      return {
        background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
        border: "1px solid rgba(71,85,105,0.45)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 48px rgba(0,0,0,0.28)",
      };
    case "glass":
    default:
      return {
        background: ACTION_GRADIENTS[action],
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
      };
  }
}

// ─── SVG action icons ──────────────────────────────────────────────────────────

function ActionIcon({
  action,
  size = 52,
}: {
  action: StoryboardAction;
  size?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: SPRINGS.TITLE });
  const glow = interpolate(frame, [0, 40, 80], [0, 0.6, 0.3], {
    extrapolateRight: "clamp",
  });

  const iconColors: Record<StoryboardAction, { bg: string; fg: string; glow: string }> = {
    show_items: { bg: "#1E3A5F", fg: "#60A5FA", glow: "rgba(96,165,250,0.4)" },
    show_equation: { bg: "#3B1F6E", fg: "#A78BFA", glow: "rgba(167,139,250,0.4)" },
    distribute_items: { bg: "#134E4A", fg: "#34D399", glow: "rgba(52,211,153,0.4)" },
    compare_cases: { bg: "#78350F", fg: "#FBBF24", glow: "rgba(251,191,36,0.4)" },
    highlight_answer: { bg: "#064E3B", fg: "#6EE7B7", glow: "rgba(110,231,183,0.4)" },
    explain: { bg: "#1E3A5F", fg: "#38BDF8", glow: "rgba(56,189,248,0.4)" },
  };

  const { bg, fg, glow: glowColor } = iconColors[action];

  const icons: Record<StoryboardAction, React.ReactNode> = {
    show_items: (
      <>
        <rect x="12" y="10" width="24" height="3" rx="1.5" fill={fg} opacity={0.9} />
        <rect x="12" y="18" width="20" height="3" rx="1.5" fill={fg} opacity={0.7} />
        <rect x="12" y="26" width="22" height="3" rx="1.5" fill={fg} opacity={0.5} />
        <circle cx="8" cy="11.5" r="2" fill={fg} />
        <circle cx="8" cy="19.5" r="2" fill={fg} opacity={0.7} />
        <circle cx="8" cy="27.5" r="2" fill={fg} opacity={0.5} />
      </>
    ),
    show_equation: (
      <>
        <text x="20" y="16" fill={fg} fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="serif">
          f(x)
        </text>
        <line x1="8" y1="21" x2="32" y2="21" stroke={fg} strokeWidth="1.5" opacity={0.5} />
        <text x="20" y="32" fill={fg} fontSize="14" fontWeight="800" textAnchor="middle" fontFamily="serif">
          =
        </text>
      </>
    ),
    distribute_items: (
      <>
        <circle cx="20" cy="10" r="3" fill={fg} />
        <line x1="20" y1="13" x2="12" y2="22" stroke={fg} strokeWidth="1.5" />
        <line x1="20" y1="13" x2="28" y2="22" stroke={fg} strokeWidth="1.5" />
        <rect x="8" y="23" width="8" height="8" rx="2" fill={fg} opacity={0.7} />
        <rect x="24" y="23" width="8" height="8" rx="2" fill={fg} opacity={0.7} />
      </>
    ),
    compare_cases: (
      <>
        <rect x="5" y="10" width="12" height="20" rx="3" fill={fg} opacity={0.4} />
        <rect x="23" y="10" width="12" height="20" rx="3" fill={fg} opacity={0.4} />
        <text x="20" y="24" fill={fg} fontSize="12" fontWeight="900" textAnchor="middle">
          VS
        </text>
      </>
    ),
    highlight_answer: (
      <>
        <polygon
          points="20,6 23,16 34,16 25,22 28,32 20,26 12,32 15,22 6,16 17,16"
          fill={fg}
          opacity={0.9}
        />
      </>
    ),
    explain: (
      <>
        <circle cx="20" cy="16" r="9" fill="none" stroke={fg} strokeWidth="2" />
        <rect x="18" y="12" width="4" height="6" rx="1" fill={fg} />
        <circle cx="20" cy="21" r="1.2" fill={fg} />
        <line x1="17" y1="28" x2="23" y2="28" stroke={fg} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="31" x2="24" y2="31" stroke={fg} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        width: size,
        height: size,
        borderRadius: 16,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 ${24 * glow}px ${glowColor}, 0 4px 16px rgba(0,0,0,0.3)`,
        flexShrink: 0,
        border: `1px solid ${fg}33`,
      }}
    >
      <svg viewBox="0 0 40 40" width={size * 0.6} height={size * 0.6}>
        {icons[action]}
      </svg>
    </div>
  );
}

// ─── Typewriter text ──────────────────────────────────────────────────────────

function TypewriterText({
  text,
  startFrame = 12,
  speed = 1.2,
  style,
}: {
  text: string;
  startFrame?: number;
  speed?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charCount = Math.min(text.length, Math.floor(elapsed * speed));
  const displayed = text.substring(0, charCount);
  const showCursor = charCount < text.length && elapsed > 0;

  return (
    <div style={style}>
      {displayed}
      {showCursor && (
        <span
          style={{
            opacity: frame % 16 < 8 ? 0.8 : 0,
            color: "#60A5FA",
            fontWeight: 300,
          }}
        >
          |
        </span>
      )}
    </div>
  );
}

// ─── Animated equation display ────────────────────────────────────────────────

function AnimatedEquation({
  equation,
  startFrame = 24,
}: {
  equation: string;
  startFrame?: number;
}) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const opacity = interpolate(elapsed, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const charCount = Math.min(
    equation.length,
    Math.floor(elapsed * 0.8)
  );
  const displayed = equation.substring(0, charCount);
  const glowIntensity = interpolate(elapsed, [0, 20, 60], [0, 1, 0.5], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        marginTop: 20,
        display: "inline-block",
        alignSelf: "flex-start",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: 18,
          background: `rgba(139,92,246,${0.08 * glowIntensity})`,
          filter: `blur(${12 * glowIntensity}px)`,
        }}
      />
      <div
        style={{
          position: "relative",
          color: "#FDE68A",
          background: "rgba(120,53,15,0.26)",
          border: "1px solid rgba(251,191,36,0.34)",
          borderRadius: 14,
          padding: "14px 24px",
          fontSize: 28,
          fontFamily: "'Courier New', monospace",
          fontWeight: 800,
          letterSpacing: 1,
          boxShadow: `0 0 ${20 * glowIntensity}px rgba(251,191,36,0.15)`,
        }}
      >
        {displayed}
        {charCount < equation.length && (
          <span style={{ opacity: frame % 12 < 6 ? 0.6 : 0, color: "#FBBF24" }}>
            _
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Highlight chips with stagger animation ───────────────────────────────────

function HighlightChips({ highlights = [] }: { highlights?: string[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
      {highlights.slice(0, 8).map((h, i) => {
        const delay = 22 + i * 5;
        const progress = spring({
          frame: Math.max(0, frame - delay),
          fps,
          config: { damping: 12, stiffness: 100 },
        });
        const scale = interpolate(progress, [0, 1], [0.5, 1]);

        return (
          <div
            key={`${h}-${i}`}
            style={{
              opacity: progress,
              transform: `scale(${scale})`,
              padding: "10px 18px",
              borderRadius: 999,
              background: "linear-gradient(135deg, rgba(96,165,250,0.18), rgba(139,92,246,0.12))",
              border: "1px solid rgba(147,197,253,0.35)",
              color: "#BFDBFE",
              fontSize: 22,
              fontWeight: 700,
              boxShadow: "0 2px 12px rgba(59,130,246,0.1)",
            }}
          >
            {h}
          </div>
        );
      })}
    </div>
  );
}

function EmphasisBadge({ target }: { target?: string }) {
  if (!target) return null;
  return (
    <div
      style={{
        alignSelf: "flex-start",
        marginTop: 16,
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(251,191,36,0.12)",
        border: "1px solid rgba(251,191,36,0.32)",
        color: "#FDE68A",
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: 0.5,
      }}
    >
      焦点: {target}
    </div>
  );
}

function EntityOverlay({
  entities,
  visualPriority,
}: {
  entities?: StoryboardEntityPositionConfig[];
  visualPriority?: StoryboardVisualPriority;
}) {
  const frame = useCurrentFrame();
  if (!entities?.length) return null;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {entities.slice(0, 10).map((entity, index) => {
        const opacity = interpolate(frame, [10 + index * 4, 24 + index * 4], [0, 1], {
          extrapolateRight: "clamp",
        });
        const scale = interpolate(frame, [10 + index * 4, 24 + index * 4], [0.75, 1], {
          extrapolateRight: "clamp",
        });
        const isPriority =
          (visualPriority === "answer" && entity.kind === "answer") ||
          (visualPriority === "constraints" && entity.kind === "constraint") ||
          (visualPriority === "equation" && entity.kind === "equation") ||
          (visualPriority === "objects" && (entity.kind === "ticket" || entity.kind === "student" || entity.kind === "object")) ||
          entity.emphasis;

        return (
          <div
            key={entity.id}
            style={{
              position: "absolute",
              left: `${entity.x * 100}%`,
              top: `${entity.y * 100}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              minWidth: 110,
              padding: entity.kind === "ticket" ? "12px 18px" : "10px 16px",
              borderRadius: entity.kind === "student" ? 24 : 16,
              background: isPriority
                ? "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(59,130,246,0.18))"
                : "rgba(15,23,42,0.76)",
              border: isPriority
                ? "1px solid rgba(251,191,36,0.45)"
                : "1px solid rgba(148,163,184,0.22)",
              color: "#F8FAFC",
              boxShadow: isPriority
                ? "0 0 24px rgba(251,191,36,0.16)"
                : "0 10px 24px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 800 }}>{entity.label}</div>
            {entity.value ? (
              <div style={{ marginTop: 4, fontSize: 15, color: "#BFDBFE", fontWeight: 700 }}>
                {entity.value}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ─── Group card with animated reveal ──────────────────────────────────────────

function GroupCard({ group, index }: { group: StoryboardGroupConfig; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = 20 + index * 8;
  const cardProgress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const slideX = interpolate(cardProgress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        opacity: cardProgress,
        transform: `translateX(${slideX}px)`,
        background: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.72))",
        border: "1px solid rgba(148,163,184,0.2)",
        borderRadius: 18,
        padding: 20,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          color: "#93C5FD",
          fontSize: 22,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#3B82F6",
            boxShadow: "0 0 8px rgba(59,130,246,0.5)",
          }}
        />
        {group.label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {group.items.slice(0, 8).map((item, i) => {
          const itemDelay = delay + 6 + i * 3;
          const itemProgress = spring({
            frame: Math.max(0, frame - itemDelay),
            fps,
            config: { damping: 10, stiffness: 120 },
          });
          return (
            <div
              key={`${item}-${i}`}
              style={{
                opacity: itemProgress,
                transform: `scale(${interpolate(itemProgress, [0, 1], [0.7, 1])})`,
                padding: "8px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg,#1D4ED8,#7C3AED)",
                color: "#fff",
                fontSize: 18,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(29,78,216,0.3)",
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
      {group.sum && (
        <div
          style={{
            marginTop: "auto",
            color: "#6EE7B7",
            fontSize: 24,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 24,
              height: 2,
              background: "linear-gradient(90deg, #6EE7B7, transparent)",
            }}
          />
          合计：{group.sum}
        </div>
      )}
    </div>
  );
}

// ─── Equation-focused layout (for show_equation action) ───────────────────────

function EquationHeroLayout({
  title,
  narration,
  equation,
  highlights,
  emphasisTarget,
  captionStyle,
}: {
  title: string;
  narration: string;
  equation?: string;
  highlights?: string[];
  emphasisTarget?: string;
  captionStyle?: StoryboardCaptionStyle;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: SPRINGS.TITLE });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          transform: `scale(${titleScale})`,
          color: "#F8FAFC",
          fontSize: 36,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.3,
          maxWidth: 900,
        }}
      >
        {title}
      </div>

      <TypewriterText
        text={narration}
        startFrame={10}
        speed={1.0}
        style={{
          color: "#CBD5E1",
          fontSize: captionStyle === "minimal" ? 20 : 24,
          lineHeight: 1.55,
          fontWeight: 600,
          textAlign: "center",
          maxWidth: 800,
        }}
      />

      <EmphasisBadge target={emphasisTarget} />

      {equation && (
        <div style={{ marginTop: 16 }}>
          <AnimatedEquation equation={equation} startFrame={20} />
        </div>
      )}

      <HighlightChips highlights={highlights} />
    </div>
  );
}

// ─── Answer highlight layout (for highlight_answer action) ────────────────────

function AnswerHighlightLayout({
  title,
  narration,
  equation,
  highlights,
  emphasisTarget,
}: {
  title: string;
  narration: string;
  equation?: string;
  highlights?: string[];
  emphasisTarget?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: SPRINGS.TITLE });
  const pulseGlow = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.8, 0.3],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          transform: `scale(${titleScale})`,
          fontSize: 48,
          marginBottom: 8,
          filter: `drop-shadow(0 0 ${12 * pulseGlow}px rgba(52,211,153,0.5))`,
        }}
      >
        ⭐
      </div>

      <div
        style={{
          transform: `scale(${titleScale})`,
          color: "#F0FDF4",
          fontSize: 38,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.3,
          maxWidth: 900,
          textShadow: "0 2px 16px rgba(52,211,153,0.3)",
        }}
      >
        {title}
      </div>

      <TypewriterText
        text={narration}
        startFrame={14}
        speed={1.0}
        style={{
          color: "#BBF7D0",
          fontSize: 26,
          lineHeight: 1.55,
          fontWeight: 600,
          textAlign: "center",
          maxWidth: 800,
        }}
      />

      {equation && <AnimatedEquation equation={equation} startFrame={22} />}

      <EmphasisBadge target={emphasisTarget} />

      <HighlightChips highlights={highlights} />
    </div>
  );
}

// ─── Default narration layout ─────────────────────────────────────────────────

function DefaultNarrationLayout({
  title,
  narration,
  equation,
  highlights,
  groups,
  action,
  panelStyle,
  emphasisTarget,
  captionStyle,
}: {
  title: string;
  narration: string;
  equation?: string;
  highlights?: string[];
  groups?: StoryboardGroupConfig[];
  action: StoryboardAction;
  panelStyle?: StoryboardPanelStyle;
  emphasisTarget?: string;
  captionStyle?: StoryboardCaptionStyle;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleScale = spring({ frame, fps, config: SPRINGS.TITLE });

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: groups?.length ? "0.9fr 1.1fr" : "1fr",
        gap: 28,
        alignItems: "stretch",
      }}
    >
      {/* Left panel — narration + equation */}
      <div
        style={{
          ...getPanelStyle(panelStyle, action),
          borderRadius: 24,
          padding: 34,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative corner accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 120,
            height: 120,
            background:
              "linear-gradient(225deg, rgba(255,255,255,0.03) 0%, transparent 60%)",
            borderBottomLeftRadius: 80,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <ActionIcon action={action} size={48} />
          <div
            style={{
              transform: `scale(${titleScale})`,
              transformOrigin: "left center",
              color: "#F8FAFC",
              fontSize: 38,
              lineHeight: 1.25,
              fontWeight: 900,
            }}
          >
            {title}
          </div>
        </div>

        <TypewriterText
          text={narration}
          startFrame={12}
          speed={1.0}
          style={{
            color: "#CBD5E1",
            fontSize: captionStyle === "minimal" ? 20 : 24,
            lineHeight: 1.65,
            fontWeight: 600,
          }}
        />

        {equation && <AnimatedEquation equation={equation} startFrame={24} />}

        <EmphasisBadge target={emphasisTarget} />

        <HighlightChips highlights={highlights} />
      </div>

      {/* Right panel — group cards */}
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
  );
}

function TicketPoolLayout({
  title,
  narration,
  equation,
  groups,
  highlights,
  entityPositions,
  emphasisTarget,
  captionStyle,
}: {
  title: string;
  narration: string;
  equation?: string;
  groups?: StoryboardGroupConfig[];
  highlights?: string[];
  entityPositions?: StoryboardEntityPositionConfig[];
  emphasisTarget?: string;
  captionStyle?: StoryboardCaptionStyle;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
      <EquationHeroLayout
        title={title}
        narration={narration}
        equation={equation}
        highlights={highlights}
        emphasisTarget={emphasisTarget}
        captionStyle={captionStyle}
      />
      <div
        style={{
          minHeight: 220,
          display: "grid",
          gridTemplateColumns: groups && groups.length > 2 ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {groups?.slice(0, 4).map((group, i) => (
          <GroupCard key={`${group.label}-${i}`} group={group} index={i} />
        ))}
      </div>
      {entityPositions?.length ? <EntityOverlay entities={entityPositions} visualPriority="objects" /> : null}
    </div>
  );
}

function StudentDistributionLayout({
  title,
  narration,
  equation,
  groups,
  highlights,
  entityPositions,
  emphasisTarget,
}: {
  title: string;
  narration: string;
  equation?: string;
  groups?: StoryboardGroupConfig[];
  highlights?: string[];
  entityPositions?: StoryboardEntityPositionConfig[];
  emphasisTarget?: string;
}) {
  return (
    <DefaultNarrationLayout
      title={title}
      narration={narration}
      equation={equation}
      highlights={highlights}
      groups={groups}
      action="distribute_items"
      panelStyle="glass"
      emphasisTarget={emphasisTarget}
      captionStyle="teacher"
    />
  );
}

function ConstraintReasoningLayout({
  title,
  narration,
  equation,
  highlights,
  entityPositions,
  emphasisTarget,
  visualPriority,
  panelStyle,
  captionStyle,
}: {
  title: string;
  narration: string;
  equation?: string;
  highlights?: string[];
  entityPositions?: StoryboardEntityPositionConfig[];
  emphasisTarget?: string;
  visualPriority?: StoryboardVisualPriority;
  panelStyle?: StoryboardPanelStyle;
  captionStyle?: StoryboardCaptionStyle;
}) {
  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 24 }}>
      <DefaultNarrationLayout
        title={title}
        narration={narration}
        equation={equation}
        highlights={highlights}
        action="explain"
        panelStyle={panelStyle}
        emphasisTarget={emphasisTarget}
        captionStyle={captionStyle}
      />
      <div
        style={{
          position: "relative",
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(15,23,42,0.82), rgba(30,41,59,0.72))",
          border: "1px solid rgba(148,163,184,0.18)",
          overflow: "hidden",
        }}
      >
        <EntityOverlay entities={entityPositions} visualPriority={visualPriority} />
      </div>
    </div>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
// (These are rendered outside this component in the caller, but we define the
//  concept here for completeness.)

// ─── Main scene ───────────────────────────────────────────────────────────────

export function StoryboardScene({
  title,
  narration,
  visualAction,
  equation,
  highlights,
  groups,
  layoutType,
  visualPriority,
  entityPositions,
  panelStyle,
  emphasisTarget,
  captionStyle,
}: StoryboardSceneProps) {
  // Choose layout strategy based on visual_action
  const renderLayout = () => {
    switch (layoutType) {
      case "ticket_pool":
        return (
          <TicketPoolLayout
            title={title}
            narration={narration}
            equation={equation}
            groups={groups}
            highlights={highlights}
            entityPositions={entityPositions}
            emphasisTarget={emphasisTarget}
            captionStyle={captionStyle}
          />
        );
      case "student_distribution":
        return (
          <StudentDistributionLayout
            title={title}
            narration={narration}
            equation={equation}
            groups={groups}
            highlights={highlights}
            entityPositions={entityPositions}
            emphasisTarget={emphasisTarget}
          />
        );
      case "constraint_reasoning":
        return (
          <ConstraintReasoningLayout
            title={title}
            narration={narration}
            equation={equation}
            highlights={highlights}
            entityPositions={entityPositions}
            emphasisTarget={emphasisTarget}
            visualPriority={visualPriority}
            panelStyle={panelStyle}
            captionStyle={captionStyle}
          />
        );
      case "final_answer_reveal":
        return (
          <AnswerHighlightLayout
            title={title}
            narration={narration}
            equation={equation}
            highlights={highlights}
            emphasisTarget={emphasisTarget}
          />
        );
      case "equation_focus":
        return (
          <EquationHeroLayout
            title={title}
            narration={narration}
            equation={equation}
            highlights={highlights}
            emphasisTarget={emphasisTarget}
            captionStyle={captionStyle}
          />
        );
      default:
        break;
    }

    switch (visualAction) {
      case "show_equation":
        return (
          <EquationHeroLayout
            title={title}
            narration={narration}
            equation={equation}
            highlights={highlights}
            emphasisTarget={emphasisTarget}
            captionStyle={captionStyle}
          />
        );
      case "highlight_answer":
        return (
          <AnswerHighlightLayout
            title={title}
            narration={narration}
            equation={equation}
            highlights={highlights}
            emphasisTarget={emphasisTarget}
          />
        );
      default:
        return (
          <DefaultNarrationLayout
            title={title}
            narration={narration}
            equation={equation}
            highlights={highlights}
            groups={groups}
            action={visualAction}
            panelStyle={panelStyle}
            emphasisTarget={emphasisTarget}
            captionStyle={captionStyle}
          />
        );
    }
  };

  return (
    <SceneShell title={ACTION_LABELS[visualAction] ?? "分镜讲解"}>
      {renderLayout()}
    </SceneShell>
  );
}
