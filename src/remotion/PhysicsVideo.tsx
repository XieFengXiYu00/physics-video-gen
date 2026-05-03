import { AbsoluteFill, Series } from "remotion";
import { SceneConfig, AnyScene } from "@/types/scene";
import { FreeBodyDiagram } from "./components/FreeBodyDiagram";
import { SolutionStep } from "./components/SolutionStep";
import { ProblemScene } from "./components/ProblemScene";
import { AnswerScene } from "./components/AnswerScene";
import { StoryboardScene } from "./components/StoryboardScene";

interface PhysicsVideoProps {
  config: SceneConfig;
}

/**
 * Top-level composition.
 *
 * Uses Remotion's `<Series>` primitive instead of manual frame-window routing —
 * each `<Series.Sequence>` is mounted only during its window and its children
 * see frame 0 at the start, so we don't have to compute `localFrame` ourselves.
 */
export function PhysicsVideo({ config }: PhysicsVideoProps) {
  return (
    <AbsoluteFill>
      <Series>
        {config.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames}>
            <SceneRenderer scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
}

function SceneRenderer({ scene }: { scene: AnyScene }) {
  switch (scene.type) {
    case "problem":
      return (
        <ProblemScene
          title={scene.title}
          subtitle={scene.subtitle}
          given={scene.given}
        />
      );
    case "diagram":
      return (
        <FreeBodyDiagram
          title={scene.title}
          objects={scene.objects}
          arrows={scene.arrows}
        />
      );
    case "solution":
      return <SolutionStep steps={scene.steps} />;
    case "storyboard":
      return (
        <StoryboardScene
          title={scene.title}
          narration={scene.narration}
          visualAction={scene.visualAction}
          equation={scene.equation}
          highlights={scene.highlights}
          groups={scene.groups}
        />
      );
    case "answer":
      return <AnswerScene answerText={scene.answerText} />;
  }
}
