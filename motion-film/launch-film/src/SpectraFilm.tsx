import React from 'react';
import { Sequence } from 'remotion';
import { SCENE_TIMINGS } from './constants';
import { OpeningScene } from './components/OpeningScene';
import { ProblemScene } from './components/ProblemScene';
import { InstrumentScene } from './components/InstrumentScene';
import { VerdictScene } from './components/VerdictScene';
import { BrandRevealScene } from './components/BrandRevealScene';
import { SoundDesign } from './components/SoundDesign';

export const SpectraFilm: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#090A0F',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        width: 1920,
        height: 1080,
        overflow: 'hidden',
      }}
    >
      {/* Global Synchronized Soundscape */}
      <SoundDesign />

      {/* SCENE 01: THE CLAIM (0.0s – 3.0s | Frames 0 to 90) */}
      <Sequence from={SCENE_TIMINGS.scene1.from} durationInFrames={SCENE_TIMINGS.scene1.duration} name="Scene 1: The Claim">
        <OpeningScene />
      </Sequence>

      {/* SCENE 02: THE FAILURE (3.0s – 6.0s | Frames 90 to 180) */}
      <Sequence from={SCENE_TIMINGS.scene2.from} durationInFrames={SCENE_TIMINGS.scene2.duration} name="Scene 2: The Failure">
        <ProblemScene />
      </Sequence>

      {/* SCENE 03: THE TWO INSTRUMENTS (6.0s – 11.0s | Frames 180 to 330) */}
      <Sequence from={SCENE_TIMINGS.scene3.from} durationInFrames={SCENE_TIMINGS.scene3.duration} name="Scene 3: The Two Instruments">
        <InstrumentScene />
      </Sequence>

      {/* SCENE 04: THE VERDICT AND REPAIR (11.0s – 15.0s | Frames 330 to 450) */}
      <Sequence from={SCENE_TIMINGS.scene4.from} durationInFrames={SCENE_TIMINGS.scene4.duration} name="Scene 4: Verdict & Repair">
        <VerdictScene />
      </Sequence>

      {/* SCENE 05: THE BRAND REVEAL (15.0s – 18.0s | Frames 450 to 540) */}
      <Sequence from={SCENE_TIMINGS.scene5.from} durationInFrames={SCENE_TIMINGS.scene5.duration} name="Scene 5: Brand Reveal">
        <BrandRevealScene />
      </Sequence>
    </div>
  );
};
