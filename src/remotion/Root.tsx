import React from "react";
import { Composition, registerRoot } from "remotion";
import {
  SplitBrandIntro,
  splitBrandIntroDefaultProps,
} from "./SplitBrandIntro";
import { JensenHuangCeoIntro, jensenDefaultProps } from "./JensenHuangCeoIntro";
import { GlitchHtmlCanvasSample, glitchDefaultProps } from "./GlitchHtmlCanvasSample";
import { TypewriterText, typewriterDefaultProps } from "./TypewriterText";
import { CountdownTimer, countdownDefaultProps } from "./CountdownTimer";
import { NeonTitle, neonTitleDefaultProps } from "./NeonTitle";
import { MinimalQuote, minimalQuoteDefaultProps } from "./MinimalQuote";
import { ParticleWaveTitle, particleWaveDefaultProps } from "./ParticleWaveTitle";
import { LogoBrandReveal, logoBrandRevealDefaultProps } from "./LogoBrandReveal";
import {
  FreeformSceneScript,
  freeformSceneScriptDefaultProps,
  getFreeformTotalFrames,
} from "./FreeformSceneScript";
import {
  CompositeVideo,
  compositeVideoDefaultProps,
  getCompositeTotalFrames,
} from "./CompositeVideo";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="SplitBrandIntro"
        component={SplitBrandIntro}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={splitBrandIntroDefaultProps}
      />
      <Composition
        id="JensenHuangCeoIntro"
        component={JensenHuangCeoIntro}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={jensenDefaultProps}
      />
      <Composition
        id="GlitchHtmlCanvasSample"
        component={GlitchHtmlCanvasSample}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={glitchDefaultProps}
      />
      <Composition
        id="TypewriterText"
        component={TypewriterText}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        defaultProps={typewriterDefaultProps}
      />
      <Composition
        id="CountdownTimer"
        component={CountdownTimer}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={countdownDefaultProps}
      />
      <Composition
        id="NeonTitle"
        component={NeonTitle}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={neonTitleDefaultProps}
      />
      <Composition
        id="MinimalQuote"
        component={MinimalQuote}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        defaultProps={minimalQuoteDefaultProps}
      />
      <Composition
        id="ParticleWaveTitle"
        component={ParticleWaveTitle}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        defaultProps={particleWaveDefaultProps}
      />
      <Composition
        id="LogoBrandReveal"
        component={LogoBrandReveal}
        durationInFrames={210}
        fps={30}
        width={1280}
        height={720}
        defaultProps={logoBrandRevealDefaultProps}
      />
      <Composition
        id="FreeformSceneScript"
        component={FreeformSceneScript}
        durationInFrames={getFreeformTotalFrames(
          freeformSceneScriptDefaultProps.scenes
        )}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={freeformSceneScriptDefaultProps}
      />
      <Composition
        id="CompositeVideo"
        component={CompositeVideo}
        durationInFrames={getCompositeTotalFrames(compositeVideoDefaultProps)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={compositeVideoDefaultProps}
      />
    </>
  );
}

registerRoot(RemotionRoot);
