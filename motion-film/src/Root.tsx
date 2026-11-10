import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { StickerLaunch } from "./StickerLaunch";
import { DURATION, FPS, SIZE } from "./timing";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="SpectraXLaunch"
        component={Film}
        durationInFrames={DURATION}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
      <Composition
        id="SpectraStickerLaunch"
        component={StickerLaunch}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
