import "@fontsource/knewave/400.css";
import { type CSSProperties } from "react";
import {
  AbsoluteFill,
  Img,
  Easing,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type JensenHuangCeoIntroProps = {
  name: string;
  role: string;
  description: string;
  /** 主题高亮色（同时驱动所有装饰元素的颜色） */
  accentColor: string;
  /** 画布背景色 */
  backgroundColor: string;
  /**
   * 人物头像 URL。可以是：
   * - staticFile 路径（如 "ceo-portrait.png"）
   * - 完整 HTTP(S) URL
   * - data:image/... base64 URI
   * 图片需已去除背景（透明 PNG）。tsx 会用 CSS drop-shadow 自动加黑笔描边。
   */
  portraitUrl?: string;
};

export const jensenDefaultProps: JensenHuangCeoIntroProps = {
  name: "Jensen Huang",
  role: "CEO & Co-Founder",
  description:
    "NVIDIA Corporation · Accelerated computing & AI platforms. 推动加速计算与生成式 AI 进入千行百业，重塑下一代算力基础设施。",
  accentColor: "#76B900",
  backgroundColor: "#0a1408",
  portraitUrl: "ceo-portrait.png",
};

/**
 * 工具函数
 * ──────────────────────────────────────────────────────────────────────────
 */

/** 四向（含对角共八向）drop-shadow 模拟黑笔描边（仅对透明 PNG 有效）。 */
function outlineFilter(thickness: number, color: string = "#000"): string {
  const offsets: [number, number][] = [
    [thickness, 0], [-thickness, 0], [0, thickness], [0, -thickness],
    [thickness, thickness], [-thickness, thickness],
    [thickness, -thickness], [-thickness, -thickness],
  ];
  return offsets
    .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${color})`)
    .join(" ");
}

/** 将 hex 颜色转为 rgba，便于派生半透明色调。 */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 判断背景色是否偏深，用于自动调整文字颜色对比度。 */
function isDarkColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 < 130;
}

/**
 * 矩阵雨背景
 * ──────────────────────────────────────────────────────────────────────────
 */
const MATRIX_CHARS = "アイウエオカ0123456789ABCDEF█▓▒░ΣΞΩ01";

function matrixColumnChar(frame: number, col: number, row: number): string {
  const i = Math.floor(random(`mx-${col}-${row}-${Math.floor(frame / 4)}`) * MATRIX_CHARS.length);
  return MATRIX_CHARS[i % MATRIX_CHARS.length] ?? "0";
}

function MatrixRain({
  width,
  height,
  accentColor,
}: {
  width: number;
  height: number;
  accentColor: string;
}) {
  const frame = useCurrentFrame();
  const cols = 48;
  const colW = width / cols;
  const rows = 28;

  return (
    <AbsoluteFill style={{ opacity: 0.14, pointerEvents: "none" }}>
      {Array.from({ length: cols }).map((_, c) => {
        const speed = 0.6 + random(`mx-speed-${c}`) * 1.4;
        const offset = random(`mx-offset-${c}`) * 200;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: c * colW,
              top: 0,
              width: colW,
              height: "100%",
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              lineHeight: 1.35,
              color: accentColor,
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: rows }).map((__, r) => {
              const y = ((frame * speed + offset + r * 14) % (height + 40)) - 20;
              return (
                <div
                  key={r}
                  style={{
                    position: "absolute",
                    top: y,
                    left: 0,
                    right: 0,
                    opacity: interpolate(r, [0, rows - 1], [0.9, 0.15], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  {matrixColumnChar(frame, c, r)}
                </div>
              );
            })}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/**
 * 围绕人像的旋转科技环
 * ──────────────────────────────────────────────────────────────────────────
 */
function TechRings({ accentColor }: { accentColor: string }) {
  const frame = useCurrentFrame();
  const rot = frame * 0.55;
  const rot2 = -frame * 0.38;

  const ringFadeId = `ringGrad-${accentColor.replace("#", "")}`;

  return (
    <svg
      width={560}
      height={560}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        opacity: 0.55,
      }}
    >
      <defs>
        <linearGradient id={ringFadeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <g transform={`translate(280,280) rotate(${rot})`}>
        <circle
          r={210}
          fill="none"
          stroke={`url(#${ringFadeId})`}
          strokeWidth={2}
          strokeDasharray="14 22"
        />
      </g>
      <g transform={`translate(280,280) rotate(${rot2})`}>
        <circle
          r={165}
          fill="none"
          stroke={accentColor}
          strokeWidth={1.5}
          strokeOpacity={0.45}
          strokeDasharray="8 16"
        />
      </g>
      <g transform={`translate(280,280) rotate(${rot * 0.6})`}>
        <circle
          r={118}
          fill="none"
          stroke={accentColor}
          strokeWidth={1}
          strokeOpacity={0.35}
          strokeDasharray="4 10"
        />
      </g>
    </svg>
  );
}

/**
 * 四角 HUD 角标
 */
function CornerBrackets({ accentColor }: { accentColor: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = spring({
    frame: frame - 6,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const len = interpolate(pulse, [0, 1], [0, 72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = interpolate(pulse, [0, 0.4, 1], [0, 0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const m = 40;
  const t = 3;

  const base: CSSProperties = {
    position: "absolute",
    width: len,
    height: len,
    opacity: o,
    borderColor: accentColor,
    borderStyle: "solid",
    boxSizing: "border-box",
  };

  return (
    <>
      <div style={{ ...base, left: m, top: m, borderWidth: `${t}px 0 0 ${t}px` }} />
      <div style={{ ...base, right: m, top: m, borderWidth: `${t}px ${t}px 0 0` }} />
      <div style={{ ...base, left: m, bottom: m, borderWidth: `0 0 ${t}px ${t}px` }} />
      <div style={{ ...base, right: m, bottom: m, borderWidth: `0 ${t}px ${t}px 0` }} />
    </>
  );
}

/**
 * 浮动几何粒子
 */
function FloatingParticles({ accentColor }: { accentColor: string }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const items = Array.from({ length: 22 }).map((_, i) => ({
    i,
    x: random(`px-${i}`) * width,
    y: random(`py-${i}`) * height,
    size: 8 + random(`ps-${i}`) * 18,
    rot: random(`pr-${i}`) * 360,
    kind: random(`pk-${i}`) > 0.5 ? "tri" : "hex",
  }));

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.35 }}>
      {items.map((p) => {
        const dx = Math.sin(frame * 0.019 + p.i * 1.7) * 40;
        const dy = Math.cos(frame * 0.023 + p.i * 2.1) * 28;
        const r = p.rot + frame * 0.8;
        const blinkSeed = `pb-${p.i}-${Math.floor(frame / 8)}`;
        return (
          <div
            key={p.i}
            style={{
              position: "absolute",
              left: p.x + dx,
              top: p.y + dy,
              width: p.size,
              height: p.size,
              transform: `rotate(${r}deg)`,
              border: `1.5px solid ${accentColor}`,
              clipPath:
                p.kind === "tri"
                  ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                  : "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
              opacity: interpolate(random(blinkSeed), [0, 1], [0.2, 0.75], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

/**
 * 全屏纵向扫描线
 */
function ScannerLine({
  width,
  accentColor,
}: {
  width: number;
  accentColor: string;
}) {
  const frame = useCurrentFrame();
  const x = interpolate(frame % 140, [0, 140], [-40, width + 40], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: 4,
        height: "100%",
        background: `linear-gradient(180deg, transparent 0%, ${withAlpha(accentColor, 0.6)} 20%, ${accentColor} 50%, ${withAlpha(accentColor, 0.6)} 80%, transparent 100%)`,
        boxShadow: `0 0 32px ${accentColor}`,
        opacity: 0.45,
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * 人像卡片（透明 PNG + CSS 描边）
 */
function PortraitCutout({
  x,
  y,
  w,
  h,
  portraitUrl,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  portraitUrl?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 40,
    fps,
    config: { damping: 9, stiffness: 155, mass: 0.55 },
  });
  const scale = interpolate(enter, [0, 1], [0.22, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tx = interpolate(enter, [0, 1], [220, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(enter, [0, 0.15, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const floatY = Math.sin(frame * 0.085) * 14;
  const floatR = Math.sin(frame * 0.041) * 1.2;

  const glitchOn = random(`g-${Math.floor(frame / 1)}`) > 0.93;
  const skew = glitchOn ? (random(`gs-${frame}`) - 0.5) * 10 : 0;
  const hue = glitchOn ? Math.round((random(`gh-${frame}`) - 0.5) * 40) : 0;

  const resolvedSrc = (() => {
    if (!portraitUrl) return staticFile("ceo-portrait.png");
    if (/^(https?:|data:)/i.test(portraitUrl)) return portraitUrl;
    return staticFile(portraitUrl);
  })();

  const outlinePx = 3;
  const baseFilter = outlineFilter(outlinePx, "#000");
  const glitchFilter = `hue-rotate(${hue}deg) contrast(1.15) saturate(1.3)`;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(${tx}px, ${floatY}px) rotate(${floatR}deg) scale(${scale}) skewX(${skew}deg)`,
        opacity,
        zIndex: 6,
      }}
    >
      <Img
        src={resolvedSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: glitchOn ? `${baseFilter} ${glitchFilter}` : baseFilter,
        }}
      />
    </div>
  );
}

/**
 * 左侧 HUD 信息面板
 */
function HudPanel({
  focusScale,
  role,
  description,
  accentColor,
  backgroundColor,
  maxWidth,
}: {
  focusScale: number;
  role: string;
  description: string;
  accentColor: string;
  backgroundColor: string;
  /** 面板最大宽度（避免与人像重叠） */
  maxWidth: number;
}) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const slide = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14, stiffness: 78 },
  });
  const x = interpolate(slide, [0, 1], [-720, 48], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const inner = spring({
    frame: frame - 52,
    fps,
    config: { damping: 16, stiffness: 95 },
  });
  const textX = interpolate(inner, [0, 1], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = interpolate(inner, [0, 0.25, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panelW = maxWidth;
  const padV = 36 * focusScale;
  const padH = 40 * focusScale;

  // 面板背景由 backgroundColor + accentColor 派生
  const darkBg = isDarkColor(backgroundColor);
  const panelBg = darkBg
    ? withAlpha(backgroundColor, 0.7)
    : withAlpha("#101010", 0.55);
  const titleColor = darkBg ? "#f4fff0" : "#ffffff";
  const bodyColor = darkBg ? "rgba(240,250,235,0.92)" : "rgba(245,250,240,0.95)";

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: height * 0.18,
        width: panelW,
        padding: `${padV}px ${padH}px ${padV}px ${padH}px`,
        background: panelBg,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1px solid ${withAlpha(accentColor, 0.4)}`,
        borderRadius: 4,
        clipPath:
          "polygon(0 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)",
        boxShadow: `0 0 60px ${withAlpha(accentColor, 0.2)}, inset 0 0 40px rgba(0,0,0,0.25)`,
        zIndex: 8,
      }}
    >
      <div style={{ transform: `translateX(${textX}px)`, opacity: op }}>
        {/* 顶部装饰条 */}
        <div
          style={{
            width: 56,
            height: 3,
            background: accentColor,
            borderRadius: 2,
            marginBottom: 22 * focusScale,
            boxShadow: `0 0 12px ${withAlpha(accentColor, 0.7)}`,
          }}
        />
        {/* 头衔大字 */}
        <div
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 38 * focusScale,
            fontWeight: 800,
            color: titleColor,
            lineHeight: 1.15,
            marginBottom: 20 * focusScale,
            textShadow: `0 0 24px ${withAlpha(accentColor, 0.4)}`,
            wordBreak: "break-word",
          }}
        >
          {role}
        </div>
        {/* 描述正文 — 自动按段落或换行符分段 */}
        <div
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 19 * focusScale,
            lineHeight: 1.7,
            color: bodyColor,
            wordBreak: "break-word",
          }}
        >
          {description.split(/\n+/).map((para, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : `${14 * focusScale}px 0 0 0` }}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 主合成：四幕动画
 * 0-50f：标题大字
 * 40f 起：人像入场
 * 40f 起：HUD 滑入
 * 全程：背景装饰
 */
export function JensenHuangCeoIntro({
  name = jensenDefaultProps.name,
  role = jensenDefaultProps.role,
  description = jensenDefaultProps.description,
  accentColor = jensenDefaultProps.accentColor,
  backgroundColor = jensenDefaultProps.backgroundColor,
  portraitUrl = jensenDefaultProps.portraitUrl,
}: Partial<JensenHuangCeoIntroProps> = {}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const focusSpring = spring({
    frame: frame - 42,
    fps,
    config: { damping: 13, stiffness: 86 },
  });
  const focusScale = interpolate(focusSpring, [0, 1], [1, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titlePop = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 120, mass: 0.85 },
  });
  const titleScale = interpolate(titlePop, [0, 1], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOp = interpolate(titlePop, [0, 0.12, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleFadeOut = interpolate(frame, [38, 50], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleDisplayOpacity = titleOp * titleFadeOut;

  const titleFontSize = Math.min(128, width * 0.068);

  // 布局：左侧 HUD 面板，右侧人像；中间留 80px 安全间距
  const hudLeft = 48;
  const portraitBoxW = Math.min(900, Math.round(width * 0.5));
  const portraitBoxH = height - 110;
  const portraitW = portraitBoxW - 60;
  const portraitH = portraitBoxH - 40;
  const portraitRight = 24;
  const portraitLeftEdge = width - portraitRight - portraitBoxW * focusScale;
  const hudMaxWidth = Math.max(360, portraitLeftEdge - hudLeft - 80);

  // 背景：从 backgroundColor 派生一个深一档底色 + accentColor 派生光晕
  const darkBg = isDarkColor(backgroundColor);
  const radialAccent = withAlpha(accentColor, darkBg ? 0.09 : 0.15);
  const titleColor = darkBg ? accentColor : accentColor;
  const titleShadowColor = withAlpha(accentColor, 0.4);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {/* 背景径向光晕 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 42%, ${radialAccent} 0%, transparent 55%)`,
        }}
      />
      {/* 噪点纹理 */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", opacity: darkBg ? 0.09 : 0.05 }}
      >
        <filter id="noiseF">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            seed="7"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseF)" opacity="0.35" />
      </svg>

      {/* 矩阵雨 */}
      <MatrixRain width={width} height={height} accentColor={accentColor} />

      {/* 浮动几何粒子 */}
      <FloatingParticles accentColor={accentColor} />

      {/* 人像区 */}
      <div
        style={{
          position: "absolute",
          right: portraitRight,
          top: 72,
          width: portraitBoxW,
          height: portraitBoxH,
          zIndex: 5,
          transform: `scale(${focusScale})`,
          transformOrigin: "right center",
        }}
      >
        <TechRings accentColor={accentColor} />
        <PortraitCutout
          x={Math.max(20, portraitBoxW - portraitW - 24)}
          y={6}
          w={portraitW}
          h={portraitH}
          portraitUrl={portraitUrl}
        />
      </div>

      {/* HUD 面板 */}
      <HudPanel
        focusScale={focusScale}
        role={role}
        description={description}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        maxWidth={hudMaxWidth}
      />

      {/* 全屏扫描线 */}
      <ScannerLine width={width} accentColor={accentColor} />

      {/* 四角 HUD 角标 */}
      <CornerBrackets accentColor={accentColor} />

      {/* 开场标题大字 */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "Knewave, cursive",
            fontSize: titleFontSize,
            letterSpacing: "0.06em",
            color: titleColor,
            textAlign: "center",
            lineHeight: 0.95,
            textTransform: "uppercase",
            transform: `scale(${titleScale})`,
            opacity: titleDisplayOpacity,
            textShadow: `0 0 40px ${titleShadowColor}, 0 12px 48px rgba(0,0,0,0.12)`,
            maxWidth: width - 160,
          }}
        >
          {name}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
