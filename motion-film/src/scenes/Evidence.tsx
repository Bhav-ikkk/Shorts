import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { fade, glide, progress } from "../ease";
import { CORAL, GRAY, GREEN, INK, PAPER } from "../timing";

const panel = (src: string) => staticFile(src);

export const Instruments: React.FC<{ frame: number; font: string; mono: string }> = ({ frame, font, mono }) => {
  const opacity = fade(frame, 120, 208, 10);
  const settle = progress(frame, 124, 168, glide);
  const scale = 1.05 - settle * 0.04;
  const first = 1 - progress(frame, 156, 172, glide);
  const second = progress(frame, 160, 176, glide);
  const line = progress(frame, 146, 164, glide);

  return (
    <AbsoluteFill style={{ background: PAPER, opacity }}>
      <Panel src={panel("spectra/02-referee-rejection-metrics.png")} scale={scale} top={36} />
      <Band>
        <div style={{ position: "relative", height: 24, fontFamily: mono, fontSize: 18, letterSpacing: 2.2, color: GRAY }}>
          <div style={{ position: "absolute", opacity: first }}>SAM 3.1  ·  VISUAL SEGMENTATION</div>
          <div style={{ position: "absolute", opacity: second }}>PIXEL MATCH  ·  DETERMINISTIC MEASUREMENT</div>
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: font,
            fontWeight: 560,
            fontSize: 48,
            letterSpacing: -1,
            color: INK,
            opacity: line,
            transform: `translateY(${(1 - line) * 10}px)`,
          }}
        >
          Two instruments. One verdict.
        </div>
      </Band>
    </AbsoluteFill>
  );
};

export const Verdict: React.FC<{ frame: number; font: string; mono: string }> = ({ frame, font, mono }) => {
  const opacity = fade(frame, 200, 280, 10);
  const settle = progress(frame, 204, 228, glide);
  const type = progress(frame, 214, 232, glide);

  return (
    <AbsoluteFill style={{ background: PAPER, opacity }}>
      <Panel src={panel("spectra/02-referee-rejection-metrics.png")} scale={1.02 - settle * 0.01} top={28} />
      <Band accent={CORAL}>
        <div
          style={{
            fontFamily: font,
            fontWeight: 560,
            fontSize: 72,
            letterSpacing: -2,
            color: CORAL,
            lineHeight: 0.9,
            opacity: type,
            transform: `translateY(${(1 - type) * 8}px)`,
          }}
        >
          REJECTED.
        </div>
        <div style={{ marginTop: 10, fontFamily: mono, fontSize: 22, letterSpacing: 0.6, color: INK, opacity: type }}>
          9.60% LOSS  &gt;  1.35% 3σ
        </div>
      </Band>
    </AbsoluteFill>
  );
};

export const Repair: React.FC<{ frame: number; font: string; mono: string }> = ({ frame, font, mono }) => {
  const opacity = fade(frame, 272, 378, 8);
  const wipe = progress(frame, 286, 324, glide);
  const toVerified = progress(frame, 326, 340, glide);
  const steps = progress(frame, 278, 296, glide);

  return (
    <AbsoluteFill style={{ background: PAPER, opacity }}>
      <div style={{ position: "absolute", top: 48, left: 64, right: 64, fontFamily: mono, fontSize: 22, letterSpacing: 1.4, color: INK, opacity: steps }}>
        VERIFY
        <span style={{ color: GRAY }}>  →  </span>
        PATCH
        <span style={{ color: GRAY }}>  →  </span>
        RE-VERIFY
      </div>
      <div
        style={{
          position: "absolute",
          top: 96,
          left: 48,
          width: 984,
          height: 640,
          overflow: "hidden",
          background: "#d9d6ce",
          opacity: 1 - toVerified,
        }}
      >
        <Img
          src={staticFile("spectra/03-closed-loop-repair-split-view.png")}
          style={{
            position: "absolute",
            width: 984,
            height: 620,
            left: 0,
            top: 10,
            clipPath: `inset(0 ${(1 - (0.34 + wipe * 0.66)) * 100}% 0 0)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            height: 620,
            left: `${(0.34 + wipe * 0.66) * 100}%`,
            width: 2,
            background: INK,
            opacity: wipe < 0.98 ? 1 : 0,
          }}
        />
      </div>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: toVerified }}>
        <Img src={staticFile("spectra/04-referee-verified-repair.png")} style={{ width: 620, height: 707 }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 64,
          bottom: 56,
          fontFamily: font,
          fontWeight: 560,
          fontSize: 40,
          letterSpacing: -0.6,
          color: GREEN,
          opacity: toVerified,
        }}
      >
        0.00% loss · Verified
      </div>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{ src: string; scale: number; top: number }> = ({ src, scale, top }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <Img src={src} style={{ width: 620, height: 707, transform: `scale(${scale})`, transformOrigin: "center top" }} />
  </div>
);

const Band: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 188,
      background: PAPER,
      borderTop: `2px solid ${accent ?? "rgba(24,24,22,0.12)"}`,
      padding: "28px 64px 0",
    }}
  >
    {children}
  </div>
);
