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
  answer: string;
}
