import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * 品牌 Logo 揭示片头 — 忠实复刻 IconMontageReveal 的四幕结构：
 *
 *   大字冲击场景 → SVG 图标动画 → Logo 圆形（含反向 scaleX 纠正）→ 品牌名扫光揭示
 *
 * 关键技巧完全对齐原版：
 * - 进场：scaleX 1.7→1 + blur 20→0 + opacity 0→1（线性）
 * - 退场：scaleX 1→1.7 + blur 0→20 + opacity 1→0（线性）
 * - 圆形 Logo 场景额外做反向 scaleX(1/scaleX)，保持圆形不变形
 * - 每幕的退出窗口 === 下一幕的进入窗口，线性叠加和恒为 1（无双亮峰）
 */

export type LogoBrandRevealProps = {
  /** 品牌首字母/简称，第一幕大字冲击（建议 2-5 字符，全大写效果最佳） */
  initials: string;
  /** 主品牌名，扫光揭示（建议 2-8 字） */
  brandName: string;
  /** 高亮块词，倾斜弹入（建议 1-4 字，与 brandName 形成强对比） */
  accentWord: string;
  /** 副标语，逐字淡入（建议 5-20 字） */
  tagline: string;
  /** 主题高亮色 */
  accentColor: string;
  /** 背景色，建议深色 */
  backgroundColor: string;
};

const defaultProps: LogoBrandRevealProps = {
  initials: "AI",
  brandName: "PHYSIQ",
  accentWord: "AI",
  tagline: "让每一帧都有意义",
  accentColor: "#f39200",
  backgroundColor: "#050505",
};

export const logoBrandRevealDefaultProps = defaultProps;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

type SceneTimeline = {
  id: string;
  in: number;
  hold: number;
  spinEnd?: number; // logo 场景：scaleX 纠正停止帧
  out: number;
  end: number;
};

function getTransform(s: SceneTimeline, frame: number) {
  // Logo 圆形场景的特殊处理（含 spinEnd 阶段）
  if (s.id === "logo" && s.spinEnd !== undefined) {
    if (frame < s.hold) {
      const dur = Math.max(1, s.hold - s.in);
      const t = clamp01((frame - s.in) / dur);
      return { scaleX: 1.7 - 0.7 * t, blur: 20 * (1 - t), opacity: t };
    }
    if (frame < s.spinEnd) {
      return { scaleX: 1, blur: 0, opacity: 1 };
    }
    if (frame >= s.out) {
      const dur = Math.max(1, s.end - s.out);
      const t = clamp01((frame - s.out) / dur);
      return { scaleX: 1 + 0.7 * t, blur: 20 * t, opacity: 1 - t };
    }
    return { scaleX: 1, blur: 0, opacity: 1 };
  }

  if (frame < s.hold) {
    const dur = Math.max(1, s.hold - s.in);
    const t = clamp01((frame - s.in) / dur);
    return { scaleX: 1.7 - 0.7 * t, blur: 20 * (1 - t), opacity: t };
  }
  if (frame >= s.out) {
    const dur = Math.max(1, s.end - s.out);
    const t = clamp01((frame - s.out) / dur);
    return { scaleX: 1 + 0.7 * t, blur: 20 * t, opacity: 1 - t };
  }
  return { scaleX: 1, blur: 0, opacity: 1 };
}

// ---------------------------------------------------------------------------
// Scene 1: 大字冲击 — 品牌首字母 + 动感圆点（对齐 RecIcon）
// ---------------------------------------------------------------------------

function InitialsScene({
  localFrame,
  initials,
  accentColor,
  backgroundColor,
}: {
  localFrame: number;
  initials: string;
  accentColor: string;
  backgroundColor: string;
}) {
  const dotPop = clamp01((localFrame - 1) / 3);
  // 退场时圆点淡出
  const dotOut = interpolate(localFrame, [10, 14], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {/* 左侧动感圆点 */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          background: accentColor,
          opacity: dotPop * dotOut,
          transform: `scale(${0.55 + 0.45 * dotPop})`,
          flexShrink: 0,
        }}
      />
      {/* 大字标题 */}
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
          fontWeight: 900,
          fontSize: 100,
          color: accentColor,
          letterSpacing: "0.03em",
          lineHeight: 1,
          marginLeft: dotOut < 0.05 ? -60 : 0,
        }}
      >
        {initials}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scene 2: SVG 图标动画 — 播放键 + 光标（对齐 PlayCursorIcon）
// ---------------------------------------------------------------------------

function PlayIconScene({
  localFrame,
  accentColor,
}: {
  localFrame: number;
  accentColor: string;
}) {
  const circleT = clamp01((localFrame - 4) / 8);
  const playT = clamp01((localFrame - 12) / 6);
  const cursorT = clamp01((localFrame - 5) / 5);
  const circleR = 78 * circleT;

  return (
    <svg width={240} height={240} viewBox="0 0 240 240" fill="none">
      {/* 外圈轮廓 */}
      <circle cx="120" cy="120" r="90" stroke={accentColor} strokeWidth="7" opacity={0.3 + 0.7 * circleT} />
      {/* 填充圆 */}
      <circle cx="120" cy="120" r={circleR} fill={accentColor} />
      {/* 播放三角 */}
      <g opacity={playT}>
        <path d="M100 86 L158 120 L100 154 Z" fill={`#1a1a1a`} />
      </g>
      {/* 鼠标光标 */}
      <g transform="translate(130 130) rotate(-30)" opacity={cursorT}>
        <path
          d="M0 0 L4 24 L10 16 L20 24 L24 20 L14 10 L23 6 Z"
          fill="#ffffff"
          stroke="#1a1a1a"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Scene 3: Logo 圆形揭示（含反向 scaleX 纠正 — 对齐 ChannelAvatarIcon）
// ---------------------------------------------------------------------------

function LogoCircleScene({
  localFrame,
  accentColor,
}: {
  localFrame: number;
  accentColor: string;
}) {
  // 进场缩放稳定
  const fadeIn = clamp01(localFrame / 10);
  const settle = interpolate(localFrame, [0, 8], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 旋转：帧 8-44 转一圈
  const spinStart = 8;
  const spinEnd = 44;
  const rotation = interpolate(localFrame, [spinStart, spinEnd], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 240,
        height: 240,
        borderRadius: "50%",
        overflow: "hidden",
        boxShadow: `0 0 0 5px ${accentColor}, 0 16px 40px rgba(0,0,0,0.6)`,
        opacity: fadeIn,
        transform: `scale(${settle})`,
        background: "#111",
      }}
    >
      <Img
        src={staticFile("logo-circle-orange.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "50% 50%",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scene 4: 品牌名扫光揭示（对齐 WordmarkReveal）
// ---------------------------------------------------------------------------

function WordmarkReveal({
  localFrame,
  accentColor,
  backgroundColor,
  brandName,
  accentWord,
  tagline,
}: {
  localFrame: number;
  accentColor: string;
  backgroundColor: string;
  brandName: string;
  accentWord: string;
  tagline: string;
}) {
  // Phase 1: 扫光从左到右揭示 brandName
  const revealDur = 16;
  const revealPct = interpolate(localFrame, [0, revealDur], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: 倾斜高亮块弹入
  const tileStart = revealDur;
  const tileDur = 7;
  const tileT = clamp01((localFrame - tileStart) / tileDur);
  const tileScale = interpolate(tileT, [0, 0.55, 1], [0.15, 1.15, 1]);

  // Phase 3: 副标语逐字淡入
  const subStart = tileStart + tileDur + 2;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      {/* 品牌名行 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily:
            'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
          fontSize: 96,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.015em",
        }}
      >
        {/* 扫光揭示 */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={{ visibility: "hidden" }}>{brandName}</span>
          <span
            style={{
              position: "absolute",
              inset: 0,
              color: "#f5f5f5",
              clipPath: `inset(0 ${100 - revealPct}% 0 0)`,
            }}
          >
            {brandName}
          </span>
          {revealPct > 0 && revealPct < 100 && (
            <div
              style={{
                position: "absolute",
                top: -4,
                bottom: -4,
                left: `${revealPct}%`,
                width: 5,
                transform: "translateX(-2.5px)",
                background: accentColor,
                boxShadow: `0 0 22px ${accentColor}, 0 0 6px ${accentColor}`,
              }}
            />
          )}
        </div>

        {/* 倾斜高亮块 */}
        {accentWord ? (
          <div
            style={{
              transform: `scale(${tileScale}) rotate(-10deg)`,
              transformOrigin: "left center",
              background: accentColor,
              color: backgroundColor,
              padding: "8px 22px",
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 72,
              fontFamily: "system-ui, -apple-system, sans-serif",
              boxShadow: `0 14px 40px ${accentColor}44`,
              lineHeight: 1,
              opacity: clamp01(tileT * 2),
            }}
          >
            {accentWord}
          </div>
        ) : null}
      </div>

      {/* 副标语逐字淡入 */}
      <div
        style={{
          display: "flex",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: "#9a9a9a",
          letterSpacing: "0.38em",
          fontSize: 22,
          textTransform: "uppercase",
        }}
      >
        {tagline.split("").map((ch, i) => {
          const t = clamp01((localFrame - (subStart + i * 1.2)) / 3);
          return (
            <span key={i} style={{ opacity: t }}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export function LogoBrandReveal({
  initials,
  brandName,
  accentWord,
  tagline,
  accentColor,
  backgroundColor,
}: LogoBrandRevealProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 四幕时间轴（退出窗口 == 下一幕进入窗口，保证线性叠加和为 1）
  const TIMELINES: SceneTimeline[] = [
    { id: "initials", in: 0,  hold: 6,  out: 20, end: 26 },
    { id: "play",     in: 20, hold: 26, out: 48, end: 54 },
    { id: "logo",     in: 48, hold: 54, spinEnd: 90, out: 90, end: 96 },
    { id: "word",     in: 90, hold: 96, out: 9999, end: 9999 },
  ];

  type SceneItem = SceneTimeline & { render: (lf: number, sx: number) => ReactNode };

  const SCENES: SceneItem[] = [
    {
      ...TIMELINES[0],
      render: (lf) => (
        <InitialsScene
          localFrame={lf}
          initials={initials}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
        />
      ),
    },
    {
      ...TIMELINES[1],
      render: (lf) => (
        <PlayIconScene localFrame={lf} accentColor={accentColor} />
      ),
    },
    {
      ...TIMELINES[2],
      // Logo 场景：传入 scaleX 用于反向纠正
      render: (lf, sx) => {
        const invX = sx > 0.001 ? 1 / sx : 1;
        return (
          <div style={{ transform: `scaleX(${invX})` }}>
            <LogoCircleScene localFrame={lf} accentColor={accentColor} />
          </div>
        );
      },
    },
    {
      ...TIMELINES[3],
      render: (lf) => (
        <WordmarkReveal
          localFrame={lf}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
          brandName={brandName}
          accentWord={accentWord}
          tagline={tagline}
        />
      ),
    },
  ];

  // 全局结尾淡出
  const outroStart = durationInFrames - 20;
  const outro = interpolate(frame, [outroStart, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        opacity: outro,
      }}
    >
      {SCENES.map((s) => {
        if (frame < s.in - 1 || frame > s.end + 2) return null;
        const { scaleX, blur, opacity } = getTransform(s, frame);
        const lf = frame - s.in;
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              transform: `scaleX(${scaleX})`,
              filter: `blur(${blur}px)`,
              opacity,
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              willChange: "transform, opacity, filter",
            }}
          >
            {s.render(lf, scaleX)}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
