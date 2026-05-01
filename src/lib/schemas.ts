import { z } from "zod";
import {
  DIFFICULTIES,
  FORCE_TYPES,
  PROBLEM_TYPES,
  SHAPES,
  SUBJECTS,
} from "./constants";

// ─── TeacherPlan (Agent 1 output) ────────────────────────────────────────────

export const physicsObjectSchema = z.object({
  id: z.string().min(1),
  mass: z.union([z.number(), z.string()]).optional(),
  label: z.string(),
  shape: z.enum(SHAPES).optional(),
  position: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .optional(),
});

export const physicsForceSchema = z.object({
  on: z.string(),
  type: z.enum(FORCE_TYPES),
  label: z.string().optional(),
  from: z.string().optional(),
  magnitude: z.string(),
  angle_deg: z.number(),
  color: z.string().optional(),
});

export const solutionStepSchema = z.object({
  step: z.number().int().positive(),
  description: z.string(),
  equation: z.string().optional(),
  result: z.string().optional(),
});

export const teacherPlanSchema = z.object({
  problem_summary: z.string(),
  subject: z.enum(SUBJECTS),
  problem_type: z.enum(PROBLEM_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  given: z.record(z.string(), z.string()),
  unknowns: z.array(z.string()),
  objects: z.array(physicsObjectSchema),
  forces: z.array(physicsForceSchema),
  solution_steps: z.array(solutionStepSchema),
  answer: z.string(),
});

export type TeacherPlanZ = z.infer<typeof teacherPlanSchema>;
