import { useCallback, useMemo } from "react";
import {
  AbsoluteFill,
  HtmlInCanvas,
  type HtmlInCanvasOnPaint,
  interpolate,
  isHtmlInCanvasSupported,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Deterministic 0..1 from frame + salt (no Math.random). */
function rnd(frame: number, salt: number): number {
  const x = Math.sin(frame * 0.971 + salt * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

export type GlitchHtmlCanvasSampleProps = {
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  backgroundColor: string;
};

export const glitchDefaultProps: GlitchHtmlCanvasSampleProps = {
  title: "GLITCH ART",
  subtitle: "故障艺术",
  description: "赛博朋克风格故障效果展示",
  accentColor: "#a78bfa",
  backgroundColor: "#0d0d12",
};

function InnerMarkup({ title, subtitle, description, accentColor, backgroundColor }: GlitchHtmlCanvasSampleProps) {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${backgroundColor} 0%, #1a1025 45%, #0a0a0f 100%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div style={{ textAlign: "center", zIndex: 1, padding: 48 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#e4e4e7",
            textTransform: "uppercase",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            fontWeight: 600,
            color: accentColor,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 18,
            color: "#71717a",
            maxWidth: 640,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function GlitchFallback(props: GlitchHtmlCanvasSampleProps) {
  const frame = useCurrentFrame();
  const shake = Math.round((rnd(frame, 1) - 0.5) * 10);
  const skew = (rnd(frame, 2) - 0.5) * 5;
  const slice = Math.floor(rnd(frame, 3) * 8);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050508" }}>
      <div
        style={{
          transform: `translate(${shake}px, ${slice}px) skewX(${skew}deg)`,
          filter: `
            drop-shadow(${-3 + (frame % 3)}px 0 0 rgba(255,0,80,0.5))
            drop-shadow(${3 - (frame % 4)}px 0 0 rgba(0,255,255,0.45))
          `,
          width: "100%",
          height: "100%",
        }}
      >
        <InnerMarkup {...props} />
      </div>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 40,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#52525b",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            maxWidth: 720,
            padding: "0 24px",
          }}
        >
          HtmlInCanvas 未启用：请使用 Chrome 149+ 并打开{" "}
          <code style={{ color: "#a1a1aa" }}>chrome://flags/#canvas-draw-element</code>
          ；当前为 CSS 回退预览。
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function GlitchHtmlCanvasSample({
  title = glitchDefaultProps.title,
  subtitle = glitchDefaultProps.subtitle,
  description = glitchDefaultProps.description,
  accentColor = glitchDefaultProps.accentColor,
  backgroundColor = glitchDefaultProps.backgroundColor,
}: Partial<GlitchHtmlCanvasSampleProps> = {}) {
  const supported = useMemo(() => isHtmlInCanvasSupported(), []);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const innerProps: GlitchHtmlCanvasSampleProps = { title, subtitle, description, accentColor, backgroundColor };

  const burst = rnd(frame, 42) > 0.94 ? 1 : 0;
  const scanPhase = (frame / fps) * Math.PI * 2;

  const onPaint: HtmlInCanvasOnPaint = useCallback(
    ({ canvas, element, elementImage }) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to acquire 2D context for HtmlInCanvas");
      }

      const w = canvas.width;
      const h = canvas.height;

      ctx.reset();
      ctx.fillStyle = "#030308";
      ctx.fillRect(0, 0, w, h);

      let matrix: DOMMatrix | undefined;
      let y = 0;
      let i = 0;

      while (y < h) {
        let stripH = 6 + Math.floor(rnd(frame, i) * 22);
        if (y + stripH > h) {
          stripH = h - y;
        }
        const baseShift = Math.round((rnd(frame, i + 900) - 0.5) * (12 + burst * 40));
        const jitter = Math.round((rnd(frame, i + 333) - 0.5) * (frame % 5));
        const shift = baseShift + jitter;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y, w, stripH);
        ctx.clip();
        ctx.filter =
          rnd(frame, i + 7000) > 0.88
            ? `brightness(${1.1 + rnd(frame, i + 8000) * 0.6}) contrast(1.15)`
            : "none";
        matrix = ctx.drawElementImage(elementImage, 0, y, w, stripH, shift, y, w, stripH);
        ctx.restore();

        y += stripH;
        i += 1;
      }

      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.22 + burst * 0.12;
      ctx.filter = "hue-rotate(210deg) saturate(3)";
      matrix = ctx.drawElementImage(elementImage, -7 - burst * 3, 0);
      ctx.filter = "hue-rotate(-30deg) saturate(3)";
      matrix = ctx.drawElementImage(elementImage, 7 + burst * 3, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";

      ctx.save();
      ctx.globalAlpha = 0.07 + 0.03 * Math.sin(scanPhase);
      ctx.fillStyle = "#000";
      for (let yy = 0; yy < h; yy += 3) {
        ctx.fillRect(0, yy, w, 1);
      }
      ctx.restore();

      const flash = interpolate(frame % 24, [0, 6, 12], [0, 0.12, 0], {
        extrapolateRight: "clamp",
      });
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (matrix) {
        element.style.transform = matrix.toString();
      }
    },
    [burst, frame, fps, scanPhase],
  );

  if (!supported) {
    return <GlitchFallback {...innerProps} />;
  }

  return (
    <HtmlInCanvas width={width} height={height} onPaint={onPaint}>
      <InnerMarkup {...innerProps} />
    </HtmlInCanvas>
  );
}
