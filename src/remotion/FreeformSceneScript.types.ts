/**
 * FreeformSceneScript — 纯类型 + 工具函数（不依赖 React / Remotion）
 * ──────────────────────────────────────────────────────────────────────
 * 这个文件可以被服务端（API route）安全 import，不会触发
 * "Remotion requires React.createContext" 错误。
 *
 * React 组件实现见 FreeformSceneScript.tsx。
 */

// ════════════════════════════════════════════════════════════════════
// Scene kinds DSL
// ════════════════════════════════════════════════════════════════════

export type TitleScene = {
  kind: "title";
  text: string;
  subtitle?: string;
  durationFrames: number;
};

export type DefinitionScene = {
  kind: "definition";
  term: string;
  definition: string;
  durationFrames: number;
};

export type BulletsScene = {
  kind: "bullets";
  title: string;
  items: string[];
  durationFrames: number;
};

export type FormulaScene = {
  kind: "formula";
  expression: string;
  explanation?: string;
  durationFrames: number;
};

export type CalloutScene = {
  kind: "callout";
  text: string;
  durationFrames: number;
};

export type QuoteScene = {
  kind: "quote";
  text: string;
  author?: string;
  durationFrames: number;
};

export type ComparisonScene = {
  kind: "comparison";
  title: string;
  left: { label: string; body: string };
  right: { label: string; body: string };
  durationFrames: number;
};

export type OutroScene = {
  kind: "outro";
  title: string;
  summary: string;
  durationFrames: number;
};

export type FreeformScene =
  | TitleScene
  | DefinitionScene
  | BulletsScene
  | FormulaScene
  | CalloutScene
  | QuoteScene
  | ComparisonScene
  | OutroScene;

export type FreeformSceneScriptProps = {
  scenes: FreeformScene[];
  accentColor: string;
  backgroundColor: string;
};

// ════════════════════════════════════════════════════════════════════
// 默认 props
// ════════════════════════════════════════════════════════════════════

export const freeformSceneScriptDefaultProps: FreeformSceneScriptProps = {
  accentColor: "#00d4ff",
  backgroundColor: "#0a0a1a",
  scenes: [
    {
      kind: "title",
      text: "牛顿第一定律",
      subtitle: "经典力学的基石",
      durationFrames: 90,
    },
    {
      kind: "definition",
      term: "惯性定律",
      definition:
        "一切物体在没有受到外力作用时，总保持静止状态或匀速直线运动状态。",
      durationFrames: 120,
    },
    {
      kind: "bullets",
      title: "三个关键点",
      items: [
        "惯性是物体保持运动状态的属性",
        "力是改变运动状态的原因",
        "没有力不需要原因，运动才需要原因",
      ],
      durationFrames: 150,
    },
    {
      kind: "formula",
      expression: "ΣF = 0  ⇒  v = const",
      explanation: "合外力为零，速度保持不变",
      durationFrames: 100,
    },
    {
      kind: "outro",
      title: "记住这一点",
      summary: "运动不需要力来维持，力只用来改变运动状态。",
      durationFrames: 100,
    },
  ],
};

// ════════════════════════════════════════════════════════════════════
// 工具函数
// ════════════════════════════════════════════════════════════════════

/** 计算 scenes 数组的总帧数 — route.ts / templates.ts 都用这个。 */
export function getFreeformTotalFrames(scenes: FreeformScene[]): number {
  if (!Array.isArray(scenes) || scenes.length === 0) return 90;
  return scenes.reduce(
    (sum, s) => sum + Math.max(30, s.durationFrames || 90),
    0
  );
}
