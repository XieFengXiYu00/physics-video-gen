/**
 * Single source of truth for cross-cutting constants.
 * Imported by both the AI prompt and the deterministic video planner,
 * so changes to colors / scene timing propagate everywhere.
 */

// ─── Force types & colors ────────────────────────────────────────────────────

export const FORCE_TYPES = [
  "gravity",
  "normal",
  "friction",
  "tension",
  "applied",
  "buoyancy",
  "spring",
  "other",
] as const;

export type ForceType = (typeof FORCE_TYPES)[number];

export const FORCE_COLORS: Record<ForceType, string> = {
  gravity: "#EF4444",
  normal: "#3B82F6",
  friction: "#F59E0B",
  tension: "#10B981",
  applied: "#8B5CF6",
  buoyancy: "#06B6D4",
  spring: "#EC4899",
  other: "#94A3B8",
};

export const FORCE_COLOR_LABELS_ZH: Record<ForceType, string> = {
  gravity: "重力",
  normal: "支持力/正压力",
  friction: "摩擦力",
  tension: "张力",
  applied: "外力",
  buoyancy: "浮力",
  spring: "弹力",
  other: "其他",
};

// ─── Subjects, problem types, difficulty ────────────────────────────────────

export const SUBJECTS = ["physics", "math", "chemistry"] as const;
export type Subject = (typeof SUBJECTS)[number];

export const PROBLEM_TYPES = [
  "force_analysis",
  "kinematics",
  "energy",
  "momentum",
  "electricity",
  "optics",
  "other",
] as const;
export type ProblemType = (typeof PROBLEM_TYPES)[number];

export const DIFFICULTIES = ["middle_school", "high_school"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SHAPES = ["block", "wedge", "sphere", "surface"] as const;
export type Shape = (typeof SHAPES)[number];

export const PROBLEM_TYPE_LABELS_ZH: Record<ProblemType, string> = {
  force_analysis: "受力分析",
  kinematics: "运动学",
  energy: "能量守恒",
  momentum: "动量",
  electricity: "电学",
  optics: "光学",
  other: "综合",
};

// ─── Video timing (in frames at 30 fps) ──────────────────────────────────────

export const VIDEO = {
  FPS: 30,
  WIDTH: 1280,
  HEIGHT: 720,
} as const;

export const SCENE_DURATIONS = {
  PROBLEM: 90,
  DIAGRAM: 150,
  ANSWER: 120,
  SOLUTION_PER_STEP_MIN: 30,
  SOLUTION_TARGET_TOTAL: 210,
} as const;

// ─── Diagram canvas ──────────────────────────────────────────────────────────

export const DIAGRAM = {
  CANVAS_W: 640,
  CANVAS_H: 420,
  ARROW_LENGTH: 80,
  ARROW_HEAD_LENGTH: 13,
  ARROW_HEAD_SPREAD: 0.38, // radians
  ARROW_LABEL_OFFSET: 22,
  ARROW_STAGGER_FRAMES: 12,
  DEFAULT_BLOCK_W: 0.14,
  DEFAULT_BLOCK_H: 0.12,
  DEFAULT_WEDGE_W: 0.3,
  DEFAULT_WEDGE_H: 0.25,
} as const;

// ─── Spring presets ──────────────────────────────────────────────────────────

export const SPRINGS = {
  ARROW: { damping: 14, stiffness: 120, mass: 0.8 },
  STEP_BADGE: { damping: 10, stiffness: 110 },
  TITLE: { damping: 12, stiffness: 80 },
  CHECKMARK: { damping: 8, stiffness: 70 },
} as const;
