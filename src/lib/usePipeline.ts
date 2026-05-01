"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TeacherPlan } from "@/types/plan";
import { SceneConfig } from "@/types/scene";

export type PipelineState =
  | "idle"
  | "analyzing"
  | "generating"
  | "done"
  | "error";

export interface PipelineResult {
  state: PipelineState;
  plan: TeacherPlan | null;
  sceneConfig: SceneConfig | null;
  error: string | null;
  /** Run the two-agent pipeline. Cancels any in-flight request first. */
  run: (input: { problemText: string; imageBase64?: string }) => Promise<void>;
  /** Abort an in-flight request and reset to idle. */
  cancel: () => void;
}

/**
 * Owns the two-step API pipeline (Teacher → VideoPlanner) plus AbortController
 * for race-condition safety. Cleanly separates network logic from UI.
 */
export function usePipeline(): PipelineResult {
  const [state, setState] = useState<PipelineState>("idle");
  const [plan, setPlan] = useState<TeacherPlan | null>(null);
  const [sceneConfig, setSceneConfig] = useState<SceneConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight request when the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
  }, []);

  const run = useCallback(
    async ({
      problemText,
      imageBase64,
    }: {
      problemText: string;
      imageBase64?: string;
    }) => {
      // Abort previous, start a fresh controller.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState("analyzing");
      setError(null);
      setPlan(null);
      setSceneConfig(null);

      try {
        // ── Agent 1: Teacher ──
        const r1 = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemText, imageBase64 }),
          signal: controller.signal,
        });
        const d1 = await r1.json();
        if (!r1.ok) throw new Error(d1.error ?? "分析失败");

        // Stale-response guard: if a newer request started, drop this one.
        if (controller.signal.aborted) return;
        const teacherPlan = d1.plan as TeacherPlan;
        setPlan(teacherPlan);

        // ── Agent 2: Video Planner ──
        setState("generating");
        const r2 = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: teacherPlan }),
          signal: controller.signal,
        });
        const d2 = await r2.json();
        if (!r2.ok) throw new Error(d2.error ?? "生成失败");
        if (controller.signal.aborted) return;

        setSceneConfig(d2.sceneConfig as SceneConfig);
        setState("done");
      } catch (err) {
        // Aborts are expected; don't surface them as errors.
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "未知错误");
        setState("error");
      }
    },
    []
  );

  return { state, plan, sceneConfig, error, run, cancel };
}
