import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { Claim } from "./scenes/Claim";
import { Catch } from "./scenes/Catch";
import { Instruments, Repair, Verdict } from "./scenes/Evidence";
import { Brand } from "./scenes/Brand";

const inter = loadInter("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const plex = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const font = inter.fontFamily;
  const mono = plex.fontFamily;
  return (
    <AbsoluteFill style={{ background: "#181816" }}>
      <Audio src={staticFile("audio/score.wav")} />
      <Claim frame={frame} font={font} mono={mono} />
      <Catch frame={frame} font={font} mono={mono} />
      <Instruments frame={frame} font={font} mono={mono} />
      <Verdict frame={frame} font={font} mono={mono} />
      <Repair frame={frame} font={font} mono={mono} />
      <Brand frame={frame} font={font} mono={mono} />
    </AbsoluteFill>
  );
};
