import { TeacherPlan, PhysicsForce, PhysicsObject, VisualStoryboardStep } from "@/types/plan";
import {
  SceneConfig,
  AnyScene,
  ArrowConfig,
  ObjectConfig,
  StoryboardSceneConfig,
} from "@/types/scene";
import {
  DIAGRAM,
  FORCE_COLORS,
  PROBLEM_TYPE_LABELS_ZH,
  SCENE_DURATIONS,
  VIDEO,
} from "@/lib/constants";

// ─── Mappers ─────────────────────────────────────────────────────────────────

function forceToArrow(force: PhysicsForce, obj: PhysicsObject): ArrowConfig {
  return {
    fromX: obj.position?.x ?? 0.5,
    fromY: obj.position?.y ?? 0.5,
    angle_deg: force.angle_deg,
    length: DIAGRAM.ARROW_LENGTH,
    color: force.color ?? FORCE_COLORS[force.type],
    label: force.label ?? force.type,
    magnitude: force.magnitude,
  };
}

function objectToConfig(obj: PhysicsObject): ObjectConfig {
  const shape = obj.shape ?? "block";
  const isWedge = shape === "wedge";
  return {
    id: obj.id,
    label: obj.label,
    shape,
    x: obj.position?.x ?? 0.5,
    y: obj.position?.y ?? 0.5,
    width: isWedge ? DIAGRAM.DEFAULT_WEDGE_W : DIAGRAM.DEFAULT_BLOCK_W,
    height: isWedge ? DIAGRAM.DEFAULT_WEDGE_H : DIAGRAM.DEFAULT_BLOCK_H,
  };
}

function storyboardToScene(
  step: VisualStoryboardStep,
  cursor: number,
  durationFrames: number
): StoryboardSceneConfig {
  return {
    type: "storyboard",
    startFrame: cursor,
    durationFrames,
    title: step.title,
    narration: step.narration,
    visualAction: step.visual_action,
    equation: step.equation,
    highlights: step.highlights,
    groups: step.groups,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Convert a TeacherPlan into a SceneConfig deterministically.
 * No LLM call — pure function so it's free, fast, and reproducible.
 * Future: swap in an LLM here for creative scene layouts.
 */
export function runVideoPlanner(plan: TeacherPlan): SceneConfig {
  const scenes: AnyScene[] = [];
  let cursor = 0;

  // ── 1. Problem statement ──
  scenes.push({
    type: "problem",
    startFrame: cursor,
    durationFrames: SCENE_DURATIONS.PROBLEM,
    title: plan.problem_summary,
    subtitle: `${plan.difficulty === "high_school" ? "高中" : "初中"} · ${PROBLEM_TYPE_LABELS_ZH[plan.problem_type]}`,
    problemText: Object.entries(plan.given)
      .map(([k, v]) => `${k} = ${v}`)
      .join("　　"),
    given: plan.given,
  });
  cursor += SCENE_DURATIONS.PROBLEM;

  // ── 2. Free-body diagram (only if there's something to show) ──
  if (plan.objects.length > 0) {
    const objects = plan.objects.map(objectToConfig);
    const objectById = new Map(plan.objects.map((o) => [o.id, o]));
    const arrows: ArrowConfig[] = plan.forces
      .map((f) => {
        const obj = objectById.get(f.on);
        return obj ? forceToArrow(f, obj) : null;
      })
      .filter((a): a is ArrowConfig => a !== null);

    scenes.push({
      type: "diagram",
      startFrame: cursor,
      durationFrames: SCENE_DURATIONS.DIAGRAM,
      title: "受力分析",
      objects,
      arrows,
    });
    cursor += SCENE_DURATIONS.DIAGRAM;
  }

  // ── 3. Visual storyboard (preferred when the teacher agent provides it) ──
  if (plan.visual_storyboard?.length) {
    const framesPerStoryboard = Math.max(
      SCENE_DURATIONS.SOLUTION_PER_STEP_MIN * 2,
      Math.floor(SCENE_DURATIONS.SOLUTION_TARGET_TOTAL / plan.visual_storyboard.length)
    );
    for (const step of plan.visual_storyboard) {
      scenes.push(storyboardToScene(step, cursor, framesPerStoryboard));
      cursor += framesPerStoryboard;
    }
  } else if (plan.solution_steps.length > 0) {
    // ── 3b. Generic solution steps fallback ──
    const stepCount = plan.solution_steps.length;
    const framesPerStep = Math.max(
      SCENE_DURATIONS.SOLUTION_PER_STEP_MIN,
      Math.floor(SCENE_DURATIONS.SOLUTION_TARGET_TOTAL / stepCount)
    );
    const solutionDur = framesPerStep * stepCount;
    scenes.push({
      type: "solution",
      startFrame: cursor,
      durationFrames: solutionDur,
      steps: plan.solution_steps.map((s) => ({
        stepNumber: s.step,
        description: s.description,
        equation: s.equation,
        result: s.result,
      })),
    });
    cursor += solutionDur;
  }

  // ── 4. Answer ──
  scenes.push({
    type: "answer",
    startFrame: cursor,
    durationFrames: SCENE_DURATIONS.ANSWER,
    answerText: plan.answer,
  });
  cursor += SCENE_DURATIONS.ANSWER;

  return {
    fps: VIDEO.FPS,
    totalFrames: cursor,
    width: VIDEO.WIDTH,
    height: VIDEO.HEIGHT,
    scenes,
  };
}
