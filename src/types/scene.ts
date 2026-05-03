import type { Shape } from "@/lib/constants";

export interface ArrowConfig {
  fromX: number; // 0-1 relative to diagram canvas
  fromY: number;
  angle_deg: number; // 0=right, 90=up
  length: number; // pixels
  color: string;
  label: string;
  magnitude: string;
}

export interface ObjectConfig {
  id: string;
  label: string;
  shape: Shape;
  x: number; // 0-1 center x
  y: number; // 0-1 center y
  width: number; // 0-1
  height: number; // 0-1
  angle?: number; // rotation
}

export type StoryboardAction =
  | "show_items"
  | "show_equation"
  | "distribute_items"
  | "compare_cases"
  | "highlight_answer"
  | "explain";

export interface StoryboardGroupConfig {
  label: string;
  items: string[];
  sum?: string;
}

export type SceneType = "problem" | "diagram" | "solution" | "storyboard" | "answer";

export interface ProblemSceneConfig {
  type: "problem";
  startFrame: number;
  durationFrames: number;
  title: string;
  subtitle: string;
  problemText: string;
  given: Record<string, string>;
}

export interface DiagramSceneConfig {
  type: "diagram";
  startFrame: number;
  durationFrames: number;
  title: string;
  objects: ObjectConfig[];
  arrows: ArrowConfig[];
  focusObjectId?: string;
}

export interface SolutionSceneConfig {
  type: "solution";
  startFrame: number;
  durationFrames: number;
  steps: Array<{
    stepNumber: number;
    description: string;
    equation?: string;
    result?: string;
  }>;
}

export interface StoryboardSceneConfig {
  type: "storyboard";
  startFrame: number;
  durationFrames: number;
  title: string;
  narration: string;
  visualAction: StoryboardAction;
  equation?: string;
  highlights?: string[];
  groups?: StoryboardGroupConfig[];
}

export interface AnswerSceneConfig {
  type: "answer";
  startFrame: number;
  durationFrames: number;
  answerText: string;
}

export type AnyScene =
  | ProblemSceneConfig
  | DiagramSceneConfig
  | SolutionSceneConfig
  | StoryboardSceneConfig
  | AnswerSceneConfig;

export interface SceneConfig {
  fps: number;
  totalFrames: number;
  width: number;
  height: number;
  scenes: AnyScene[];
}
