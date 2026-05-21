import type {
  Difficulty,
  ForceType,
  ProblemType,
  Shape,
  Subject,
} from "@/lib/constants";

export interface PhysicsObject {
  id: string;
  mass?: number | string;
  label: string;
  shape?: Shape;
  position?: { x: number; y: number }; // 0-1 relative
}

export interface PhysicsForce {
  on: string; // object id
  type: ForceType;
  label?: string;
  from?: string;
  magnitude: string;
  angle_deg: number; // 0=right, 90=up, 180=left, 270=down
  color?: string;
}

export interface SolutionStep {
  step: number;
  description: string;
  equation?: string;
  result?: string;
}

export type VisualAction =
  | "show_items"
  | "show_equation"
  | "distribute_items"
  | "compare_cases"
  | "highlight_answer"
  | "explain";

export type StoryboardLayoutType =
  | "ticket_pool"
  | "student_distribution"
  | "constraint_reasoning"
  | "final_answer_reveal"
  | "equation_focus"
  | "default";

export type StoryboardVisualPriority = "objects" | "equation" | "constraints" | "answer";

export type StoryboardPanelStyle = "glass" | "flat" | "spotlight" | "board";

export type StoryboardCaptionStyle = "bilingual" | "teacher" | "minimal";

export type StoryboardAnimationCue = "stagger_in" | "count_up" | "spotlight" | "distribute" | "reveal_answer";

export interface StoryboardEntityPosition {
  id: string;
  label: string;
  x: number;
  y: number;
  kind?: "ticket" | "student" | "equation" | "constraint" | "answer" | "object";
  emphasis?: boolean;
  value?: string;
}

export interface VisualStoryboardGroup {
  label: string;
  items: string[];
  sum?: string;
}

export interface VisualStoryboardStep {
  title: string;
  narration: string;
  visual_action: VisualAction;
  equation?: string;
  highlights?: string[];
  groups?: VisualStoryboardGroup[];
  layout_type?: StoryboardLayoutType;
  visual_priority?: StoryboardVisualPriority;
  entity_positions?: StoryboardEntityPosition[];
  panel_style?: StoryboardPanelStyle;
  emphasis_target?: string;
  animation_cue?: StoryboardAnimationCue;
  step_duration?: number;
  caption_style?: StoryboardCaptionStyle;
}

export interface TeacherPlan {
  problem_summary: string;
  subject: Subject;
  problem_type: ProblemType;
  difficulty: Difficulty;
  given: Record<string, string>;
  unknowns: string[];
  objects: PhysicsObject[];
  forces: PhysicsForce[];
  solution_steps: SolutionStep[];
  visual_storyboard?: VisualStoryboardStep[];
  answer: string;
}
