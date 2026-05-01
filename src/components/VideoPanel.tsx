"use client";

import { useMemo } from "react";
import { Player } from "@remotion/player";
import { PhysicsVideo } from "@/remotion/PhysicsVideo";
import { SceneConfig } from "@/types/scene";

interface VideoPanelProps {
  sceneConfig: SceneConfig;
}

export function VideoPanel({ sceneConfig }: VideoPanelProps) {
  // Memoize so the Player doesn't re-mount on parent re-renders.
  const inputProps = useMemo(() => ({ config: sceneConfig }), [sceneConfig]);
  const seconds = Math.round(sceneConfig.totalFrames / sceneConfig.fps);

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
