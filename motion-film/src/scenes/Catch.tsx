import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { fade, glide, premium, progress } from "../ease";
import { CORAL, INK, PAPER } from "../timing";

/**
 * Asset 01 is 1143×720.
 * Measured checkout green: x825–1065, y569–627.
 * Measured hashed loss: x825–1065, y622–681.
 * The plate is drawn at height 1080 (×1.5) and shifted so that region sits in frame.
 */
const PLATE_W = (1143 / 720) * 1080;
const PLATE_H = 1080;
const SHIFT_X = 1080 - PLATE_W;
const BRACKET = {
  left: (820 / 1143) * PLATE_W,
  top: (630 / 720) * PLATE_H,
  width: (248 / 1143) * PLATE_W,
  height: (46 / 720) * PLATE_H,
};
const ORIGIN_X = BRACKET.left + BRACKET.width / 2;
const ORIGIN_Y = BRACKET.top + 8;

export const Catch: React.FC<{ frame: number; font: string; mono: string }> = ({ frame, font, mono }) => {
  const opacity = fade(frame, 36, 128, 10);
  const push = progress(frame, 48, 114, glide);
  const scale = 1 + push * 0.14;
  const draw = progress(frame, 62, 86, premium);
  const type = progress(frame, 70, 88, glide);

  return (
    <AbsoluteFill style={{ background: PAPER, opacity, overflow: "hidden" }}>
      <div
        style={{
          width: PLATE_W,
          height: PLATE_H,
          transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px`,
          transform: `translateX(${SHIFT_X}px) scale(${scale})`,
        }}
      >
        <Img
          src={staticFile("spectra/01-optical-viewport-occlusion.png")}
          style={{ width: PLATE_W, height: PLATE_H, display: "block" }}
        />
        <Bracket draw={draw} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 56,
          background: PAPER,
          color: INK,
          padding: "18px 22px 16px",
          opacity: type,
          transform: `translateY(${(1 - type) * 12}px)`,
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 18, letterSpacing: 2.4, color: CORAL }}>MEASURED EDGE</div>
        <div style={{ fontFamily: font, fontWeight: 560, fontSize: 64, letterSpacing: -1.6, lineHeight: 0.95, marginTop: 6 }}>
          9.6%
        </div>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 1.6, marginTop: 4 }}>VISIBILITY LOSS</div>
      </div>
    </AbsoluteFill>
  );
};

const Bracket: React.FC<{ draw: number }> = ({ draw }) => {
  const arm = 28;
  const borders = (edges: string) =>
    ({
      position: "absolute" as const,
      width: arm,
      height: arm,
      borderColor: CORAL,
      borderStyle: "solid",
      borderWidth: 0,
      ...(edges === "tl" ? { borderTopWidth: 3, borderLeftWidth: 3, top: 0, left: 0 } : {}),
      ...(edges === "tr" ? { borderTopWidth: 3, borderRightWidth: 3, top: 0, right: 0 } : {}),
      ...(edges === "bl" ? { borderBottomWidth: 3, borderLeftWidth: 3, bottom: 0, left: 0 } : {}),
      ...(edges === "br" ? { borderBottomWidth: 3, borderRightWidth: 3, bottom: 0, right: 0 } : {}),
      opacity: draw,
    });
  return (
    <div style={{ position: "absolute", left: BRACKET.left, top: BRACKET.top, width: BRACKET.width, height: BRACKET.height }}>
      <div style={borders("tl")} />
      <div style={borders("tr")} />
      <div style={borders("bl")} />
      <div style={borders("br")} />
    </div>
  );
};
