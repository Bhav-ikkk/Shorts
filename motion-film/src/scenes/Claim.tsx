import React from "react";
import { AbsoluteFill } from "remotion";
import { arrive, leave, premium, progress } from "../ease";
import { interpolate } from "remotion";
import { CORAL, GRAY, INK, PAPER } from "../timing";

export const Claim: React.FC<{ frame: number; font: string; mono: string }> = ({ frame, font, mono }) => {
  const opacity = interpolate(frame, [34, 42], [1, 0], {
    easing: leave,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line = progress(frame, 2, 16, premium);
  const label = progress(frame, 6, 18, arrive);
  const title = progress(frame, 14, 30, arrive);
  const tick = progress(frame, 26, 36, premium);

  return (
    <AbsoluteFill style={{ background: INK, opacity, justifyContent: "center", padding: "0 96px" }}>
      <div style={{ width: 168, height: 2, background: PAPER, transform: `scaleX(${line})`, transformOrigin: "left center" }} />
      <div
        style={{
          marginTop: 28,
          fontFamily: mono,
          fontSize: 22,
          letterSpacing: 3.2,
          color: GRAY,
          opacity: label,
          transform: `translateY(${(1 - label) * 10}px)`,
        }}
      >
        AI AGENT  /  STATUS: COMPLETE
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: font,
          fontWeight: 560,
          fontSize: 168,
          letterSpacing: -5,
          lineHeight: 0.9,
          color: PAPER,
          opacity: title,
          transform: `translateY(${(1 - title) * 16}px)`,
        }}
      >
        FIXED.
      </div>
      <div style={{ marginTop: 22, width: 56 * tick, height: 3, background: CORAL }} />
    </AbsoluteFill>
  );
};
