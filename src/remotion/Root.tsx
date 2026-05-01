import React from "react";
import { Composition } from "remotion";
import { PhysicsVideo } from "./PhysicsVideo";
import { SceneConfig } from "@/types/scene";
import { FORCE_COLORS, SCENE_DURATIONS, VIDEO } from "@/lib/constants";

const { PROBLEM, DIAGRAM: DIAG_DUR, ANSWER } = SCENE_DURATIONS;
const SOLUTION_DUR = 120;

const DEMO_CONFIG: SceneConfig = {
  fps: VIDEO.FPS,
  totalFrames: PROBLEM + DIAG_DUR + SOLUTION_DUR + ANSWER,
  width: VIDEO.WIDTH,
  height: VIDEO.HEIGHT,
  scenes: [
    {
      type: "problem",
      startFrame: 0,
      durationFrames: PROBLEM,
      title: "木楔受力分析",
      subtitle: "高中物理 · 受力分析",
      problemText: "M=10kg，μ=0.02，m=1kg，θ=30°，s=1.4m，v=1.4m/s",
      given: { M: "10 kg", m: "1.0 kg", μ: "0.02", θ: "30°", s: "1.4 m", v: "1.4 m/s" },
    },
    {
      type: "diagram",
      startFrame: PROBLEM,
      durationFrames: DIAG_DUR,
      title: "受力分析",
      objects: [
        { id: "wedge", label: "M", shape: "wedge", x: 0.5, y: 0.6, width: 0.3, height: 0.25 },
        { id: "block", label: "m", shape: "block", x: 0.6, y: 0.38, width: 0.13, height: 0.11 },
      ],
      arrows: [
        { fromX: 0.6, fromY: 0.38, angle_deg: 270, length: 75, color: FORCE_COLORS.gravity, label: "mg", magnitude: "10N" },
        { fromX: 0.6, fromY: 0.38, angle_deg: 120, length: 65, color: FORCE_COLORS.normal, label: "N", magnitude: "N" },
        { fromX: 0.6, fromY: 0.38, angle_deg: 210, length: 55, color: FORCE_COLORS.friction, label: "f", magnitude: "f" },
      ],
    },
    {
      type: "solution",
      startFrame: PROBLEM + DIAG_DUR,
      durationFrames: SOLUTION_DUR,
      steps: [
        { stepNumber: 1, description: "由运动学求加速度", equation: "v²=2as", result: "a = 0.7 m/s²" },
        { stepNumber: 2, description: "对物块受力分析", equation: "N − mg cosθ = ma", result: "N ≈ 9.4 N" },
        { stepNumber: 3, description: "对木楔水平方向合力为零，求摩擦力 f₀" },
      ],
    },
    {
      type: "answer",
      startFrame: PROBLEM + DIAG_DUR + SOLUTION_DUR,
      durationFrames: ANSWER,
      answerText: "地面对木楔的摩擦力大小约为 0.35 N，方向水平向右",
    },
  ],
};

export function RemotionRoot() {
  return (
    <Composition
      id="PhysicsVideo"
      component={PhysicsVideo as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={DEMO_CONFIG.totalFrames}
      fps={DEMO_CONFIG.fps}
      width={DEMO_CONFIG.width}
      height={DEMO_CONFIG.height}
      defaultProps={{ config: DEMO_CONFIG }}
    />
  );
}
