import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { arrive, progress } from "../ease";
import { GRAY, GREEN, INK, PAPER } from "../timing";

export const Brand: React.FC<{ frame: number; font: string; mono: string }> = ({ frame, font, mono }) => {
  const opacity = progress(frame, 370, 384, arrive);
  const mark = progress(frame, 366, 384, arrive);
  const name = progress(frame, 376, 394, arrive);
  const line = progress(frame, 390, 408, arrive);

  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        opacity,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Img
        src={staticFile("spectra/spectra-logo.svg")}
        style={{
          width: 112,
          height: 112,
          opacity: mark,
          transform: `translateY(${(1 - mark) * 8}px)`,
        }}
      />
      <div
        style={{
          marginTop: 28,
          fontFamily: font,
          fontWeight: 560,
          fontSize: 84,
          letterSpacing: -2.4,
          color: INK,
          lineHeight: 0.92,
          opacity: name,
          transform: `translateY(${(1 - name) * 10}px)`,
        }}
      >
        Spectra
        <span style={{ fontFamily: mono, fontSize: 22, letterSpacing: 2, color: GRAY, marginLeft: 14 }}>V3.0</span>
      </div>
      <div style={{ marginTop: 22, fontFamily: font, fontWeight: 500, fontSize: 32, letterSpacing: -0.4, color: INK, opacity: line }}>
        Don’t trust “done.” Measure it.
      </div>
      <div style={{ marginTop: 28, width: 48, height: 3, background: GREEN, opacity: line }} />
      <div style={{ marginTop: 18, fontFamily: mono, fontSize: 24, letterSpacing: 0.4, color: INK, opacity: line }}>
        spectra-lyart.vercel.app
      </div>
    </AbsoluteFill>
  );
};
