"use client";

import { useCallback, useRef, useState } from "react";
import { ChatMessage } from "@/lib/useChatStore";
import { useLang } from "@/lib/LangContext";
import { Player, PlayerRef } from "@remotion/player";
import { SplitBrandIntro } from "@/remotion/SplitBrandIntro";
import { JensenHuangCeoIntro } from "@/remotion/JensenHuangCeoIntro";
import { GlitchHtmlCanvasSample } from "@/remotion/GlitchHtmlCanvasSample";
import { TypewriterText } from "@/remotion/TypewriterText";
import { CountdownTimer } from "@/remotion/CountdownTimer";
import { NeonTitle } from "@/remotion/NeonTitle";
import { MinimalQuote } from "@/remotion/MinimalQuote";
import { ParticleWaveTitle } from "@/remotion/ParticleWaveTitle";
import { LogoBrandReveal } from "@/remotion/LogoBrandReveal";
import { FreeformSceneScript } from "@/remotion/FreeformSceneScript";
import { CompositeVideo } from "@/remotion/CompositeVideo";
import html2canvas from "html2canvas";

// Map templateId → React component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  SplitBrandIntro,
  JensenHuangCeoIntro,
  GlitchHtmlCanvasSample,
  TypewriterText,
  CountdownTimer,
  NeonTitle,
  MinimalQuote,
  ParticleWaveTitle,
  LogoBrandReveal,
  FreeformSceneScript,
  CompositeVideo,
};

interface ChatMessageItemProps {
  message: ChatMessage;
  onRefine: (feedback: string) => void;
}

export function ChatMessageItem({ message, onRefine }: ChatMessageItemProps) {
  const { t } = useLang();
  const { role, content, imageBase64, templateId, templateProps, durationFrames, fps, width, height, autoUpgradedFrom, error, loading } = message;
  const [downloading, setDownloading] = useState<"video" | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const playerRef = useRef<PlayerRef>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const TemplateComponent = templateId ? TEMPLATE_COMPONENTS[templateId] : null;

  const handleDownloadVideo = useCallback(async () => {
    if (!templateProps || !durationFrames || !fps || !width || !height) return;
    const player = playerRef.current;
    const container = playerContainerRef.current;
    if (!player || !container) {
      alert("播放器未就绪");
      return;
    }

    setDownloading("video");
    setRecordingProgress(0);

    try {
      const frameInterval = 1000 / fps;
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const ctx = offscreenCanvas.getContext("2d");
      if (!ctx) throw new Error("无法创建画布上下文");

      const stream = offscreenCanvas.captureStream(fps);
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        mediaRecorder.onerror = (e) => reject(e);
      });

      player.pause();
      player.seekTo(0);
      await new Promise((r) => setTimeout(r, 200));
      mediaRecorder.start(100);

      const playerElement = container.querySelector(".remotion-player") as HTMLElement;
      const targetElement = playerElement || container;

      for (let frame = 0; frame < durationFrames; frame++) {
        player.seekTo(frame);
        await new Promise((r) => setTimeout(r, 50));
        const frameCanvas = await html2canvas(targetElement, {
          backgroundColor: "#000000",
          scale: 1,
          logging: false,
          useCORS: true,
          width,
          height,
        });
        ctx.drawImage(frameCanvas, 0, 0, width, height);
        await new Promise((r) => setTimeout(r, Math.max(frameInterval - 50, 0)));
        setRecordingProgress(Math.round(((frame + 1) / durationFrames) * 100));
      }

      await new Promise((r) => setTimeout(r, 300));
      mediaRecorder.stop();

      const blob = await recordingPromise;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "视频下载失败");
    } finally {
      setDownloading(null);
      setRecordingProgress(0);
    }
  }, [templateProps, durationFrames, fps, width, height]);

  return (
    <div className="message">
      {/* Avatar */}
      <div className={`message-avatar ${role}`}>
        {role === "user" ? (
          "Y"
        ) : (
          <img
            src="/logo.png"
            alt="AI"
            className="w-full h-full object-contain"
            style={{ borderRadius: "50%" }}
          />
        )}
      </div>

      <div className="message-content">
        {/* User message */}
        {role === "user" && (
          <>
            {content && <p className="whitespace-pre-wrap">{content}</p>}
            {imageBase64 && (
              <img
                src={`data:image/jpeg;base64,${imageBase64}`}
                alt="参考图片"
                className="image-preview-small mt-2"
              />
            )}
          </>
        )}

        {/* Assistant message */}
        {role === "assistant" && (
          <>
            {loading && (
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3 border border-red-200">
                {error}
              </div>
            )}

            {content && !loading && !error && !TemplateComponent && (
              <div className="text-sm leading-relaxed">
                {formatContent(content)}
              </div>
            )}

            {/* Video player */}
            {TemplateComponent && templateProps && durationFrames && fps && width && height && (
              <div className="video-card">
                <div className="video-card-header">
                  {t("videoLabel")} · {Math.round(durationFrames / fps)}{t("videoSec")}
                </div>
                {autoUpgradedFrom && (
                  <div
                    className="text-xs px-3 py-2 mb-2 rounded-md"
                    style={{
                      background: "var(--accent-soft, rgba(243, 146, 0, 0.08))",
                      color: "var(--accent, #f39200)",
                      border: "1px solid var(--accent-border, rgba(243, 146, 0, 0.3))",
                    }}
                    title={`原选模板：${autoUpgradedFrom}`}
                  >
                    ℹ {t("autoUpgradeHint")}
                  </div>
                )}
                <div className="video-card-body" ref={playerContainerRef}>
                  {/* key 中带入 portraitUrl 长度，确保上传图片处理完后 Player 重新挂载；
                      CompositeVideo 的人像在 introProps.portraitUrl 里，也要纳入 key */}
                  <Player
                    key={(() => {
                      const props = templateProps as Record<string, unknown>;
                      const topPortrait = typeof props?.portraitUrl === "string" ? (props.portraitUrl as string).length : 0;
                      const intro = props?.introProps as Record<string, unknown> | undefined;
                      const introPortrait = intro && typeof intro.portraitUrl === "string" ? (intro.portraitUrl as string).length : 0;
                      return `${templateId}-${topPortrait}-${introPortrait}`;
                    })()}
                    ref={playerRef}
                    component={TemplateComponent}
                    inputProps={templateProps}
                    durationInFrames={durationFrames}
                    fps={fps}
                    compositionWidth={width}
                    compositionHeight={height}
                    style={{ width: "100%", aspectRatio: `${width}/${height}` }}
                    controls
                    autoPlay={false}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      className="refine-btn"
                      onClick={handleDownloadVideo}
                      disabled={downloading !== null}
                    >
                      {downloading === "video"
                        ? `${t("downloadVideoProgress")} ${recordingProgress}%`
                        : t("downloadVideo")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Regenerate */}
            {TemplateComponent && templateProps && !loading && (
              <div className="flex gap-2 mt-3">
                <button
                  className="refine-btn"
                  onClick={() => onRefine(t("regeneratePrompt"))}
                >
                  {t("regenerate")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatContent(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className={line === "" ? "h-2" : ""}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
        )}
      </p>
    );
  });
}
