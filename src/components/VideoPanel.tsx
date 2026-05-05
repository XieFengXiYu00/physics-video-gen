"use client";

import { useMemo, useState, useCallback } from "react";
import { Player } from "@remotion/player";
import { PhysicsVideo } from "@/remotion/PhysicsVideo";
import { SceneConfig } from "@/types/scene";

interface VideoPanelProps {
  sceneConfig: SceneConfig;
}

export function VideoPanel({ sceneConfig }: VideoPanelProps) {
  const inputProps = useMemo(() => ({ config: sceneConfig }), [sceneConfig]);
  const seconds = Math.round(sceneConfig.totalFrames / sceneConfig.fps);
  const [downloading, setDownloading] = useState<"video" | "pptx" | null>(null);

  const handleDownloadVideo = useCallback(async () => {
    setDownloading("video");
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneConfig }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "渲染失败");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `physics-video-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "下载失败");
    } finally {
      setDownloading(null);
    }
  }, [sceneConfig]);

  const handleDownloadPptx = useCallback(async () => {
    setDownloading("pptx");
    try {
      const res = await fetch("/api/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneConfig }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "导出失败");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `physics-slides-${Date.now()}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "下载失败");
    } finally {
      setDownloading(null);
    }
  }, [sceneConfig]);

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="section-label text-fuchsia-300">Video Render · Live Preview</span>
        <div className="flex items-center gap-2 text-[10px] font-mono-tech tracking-widest uppercase text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
          Streaming
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-fuchsia-500/20 shadow-[0_0_36px_rgba(217,70,239,0.15)] relative">
        <Player
          component={PhysicsVideo}
          inputProps={inputProps}
          durationInFrames={sceneConfig.totalFrames}
          compositionWidth={sceneConfig.width}
          compositionHeight={sceneConfig.height}
          fps={sceneConfig.fps}
          style={{ width: "100%", display: "block" }}
          controls
          autoPlay
          loop
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <Stat label="Scenes" value={String(sceneConfig.scenes.length)} />
        <Stat label="Duration" value={`${seconds}s`} />
        <Stat label="Resolution" value={`${sceneConfig.width}×${sceneConfig.height}`} />
        <Stat label="Framerate" value={`${sceneConfig.fps} fps`} />
      </div>

      {/* Download buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={handleDownloadVideo}
          disabled={downloading !== null}
          className="flex-1 py-2.5 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-fuchsia-200 font-medium font-mono-tech tracking-wider uppercase text-xs transition-all flex items-center justify-center gap-2"
        >
          {downloading === "video" ? (
            <>
              <SpinnerSmall />
              渲染中...
            </>
          ) : (
            <>
              <DownloadIcon />
              下载视频 MP4
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleDownloadPptx}
          disabled={downloading !== null}
          className="flex-1 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-200 font-medium font-mono-tech tracking-wider uppercase text-xs transition-all flex items-center justify-center gap-2"
        >
          {downloading === "pptx" ? (
            <>
              <SpinnerSmall />
              导出中...
            </>
          ) : (
            <>
              <SlidesIcon />
              下载 PPTX
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/40 border border-cyan-500/10 rounded-lg px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono-tech">
        {label}
      </div>
      <div className="text-cyan-200 font-mono-tech text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}

function SpinnerSmall() {
  return (
    <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function SlidesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
