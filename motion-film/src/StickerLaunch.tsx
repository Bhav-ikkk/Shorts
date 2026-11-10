import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

const inter = loadInter("normal", { weights: ["500", "700"], subsets: ["latin"] });
const plex = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

const INK = "#181816";
const PAPER = "#F4F1E8";
const CORAL = "#E05246";
const GREEN = "#2E7D52";
const snap = Easing.bezier(0.16, 1, 0.3, 1);
const glide = Easing.bezier(0.45, 0.05, 0.2, 1);
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const LANE = ["PASS", "SAM", "PIXEL", "9.6%", "REJECT", "0.00%", "VLM", "MEASURE"];

export const StickerLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const font = inter.fontFamily;
  const mono = plex.fontFamily;
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: font, color: INK, overflow: "hidden" }}>
      <Audio src={staticFile("audio/sticker-score.wav")} />
      <Field frame={frame} mono={mono} />
      <div style={{ position: "absolute", top: 36, left: 48, fontFamily: mono, fontSize: 18, letterSpacing: 1, zIndex: 3 }}>spectra</div>
      <Scene frame={frame} enter={0} exit={88} from="up">
        <Fixed font={font} mono={mono} frame={frame} />
      </Scene>
      <Scene frame={frame} enter={72} exit={172} from="right">
        <Stat font={font} mono={mono} frame={frame} />
      </Scene>
      <Scene frame={frame} enter={156} exit={292} from="left">
        <Proof font={font} mono={mono} frame={frame} />
      </Scene>
      <Scene frame={frame} enter={276} exit={402} from="right">
        <Rows font={font} mono={mono} frame={frame} />
      </Scene>
      <Scene frame={frame} enter={386} exit={480} from="up" hold>
        <EndCard font={font} mono={mono} frame={frame} />
      </Scene>
    </AbsoluteFill>
  );
};

const Field: React.FC<{ frame: number; mono: string }> = ({ frame, mono }) => {
  const shift = (frame * 1.15) % 280;
  const flip = interpolate(frame, [28, 48], [0, 1], clamp);
  const tone = flip > 0.5 ? CORAL : GREEN;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(24,24,22,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,22,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          backgroundPosition: `${frame * 0.35}px ${frame * 0.2}px`,
        }}
      />
      {[0, 1].map((row) => (
        <div key={row} style={{ position: "absolute", top: row === 0 ? 78 : 930, left: -shift - row * 80, display: "flex", gap: 18 }}>
          {Array.from({ length: 22 }, (_, i) => (
            <Chip key={i} mono={mono} tone={tone} label={row === 0 ? (flip > 0.5 ? "MISS" : "PASS") : LANE[i % LANE.length]} />
          ))}
        </div>
      ))}
      <Lane x={28} frame={frame} mono={mono} tone={tone} />
      <Lane x={1748} frame={frame} mono={mono} tone={tone} reverse />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(244,241,232,0.94) 0%, rgba(244,241,232,0.72) 38%, rgba(244,241,232,0) 68%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Lane: React.FC<{ x: number; frame: number; mono: string; tone: string; reverse?: boolean }> = ({ x, frame, mono, tone, reverse }) => {
  const labels = reverse ? [...LANE].reverse() : LANE;
  const loop = [...labels, ...labels];
  const travel = (frame * 0.7) % (labels.length * 52);
  return (
    <div style={{ position: "absolute", top: 156, left: x, height: 760, width: 150, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${reverse ? travel - labels.length * 52 : -travel}px)` }}>
        {loop.map((label, i) => (
          <Chip key={i} mono={mono} tone={tone} label={label} />
        ))}
      </div>
    </div>
  );
};

const Chip: React.FC<{ mono: string; tone: string; label: string }> = ({ mono, tone, label }) => (
  <div
    style={{
      background: "#fff",
      color: INK,
      border: `2.5px solid ${INK}`,
      borderRadius: 999,
      boxShadow: `3px 3px 0 ${tone}`,
      padding: "7px 14px",
      fontFamily: mono,
      fontSize: 15,
      letterSpacing: 0.6,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

const Scene: React.FC<{
  frame: number;
  enter: number;
  exit: number;
  from: "up" | "left" | "right";
  hold?: boolean;
  children: React.ReactNode;
}> = ({ frame, enter, exit, from, hold, children }) => {
  if (frame < enter || frame > exit) return null;
  const inn = interpolate(frame, [enter, enter + 16], [0, 1], { easing: glide, ...clamp });
  const out = hold ? 0 : interpolate(frame, [exit - 16, exit], [0, 1], { easing: glide, ...clamp });
  const slide = from === "right" ? 28 : from === "left" ? -28 : 0;
  const x = (1 - inn) * slide + out * (from === "left" ? 18 : from === "right" ? -18 : 0);
  const y = from === "up" ? (1 - inn) * 18 + out * -10 : out * -8;
  const scale = 0.985 + inn * 0.015 - out * 0.012;
  return (
    <AbsoluteFill style={{ opacity: Math.min(inn, 1 - out), transform: `translate(${x}px, ${y}px) scale(${scale})` }}>{children}</AbsoluteFill>
  );
};

const Window: React.FC<{ title: string; accent: string; width: number; mono: string; children: React.ReactNode }> = ({
  title,
  accent,
  width,
  mono,
  children,
}) => (
  <div style={{ width, background: "#fff", border: `3px solid ${INK}`, borderRadius: 22, boxShadow: `10px 10px 0 ${INK}`, overflow: "hidden" }}>
    <div style={{ height: 52, background: accent, borderBottom: `3px solid ${INK}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 8 }}>
      {["#E05246", "#E7B416", "#2E7D52"].map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: 99, background: c, border: `2px solid ${INK}` }} />
      ))}
      <div style={{ marginLeft: 10, fontFamily: mono, fontSize: 16 }}>{title}</div>
    </div>
    {children}
  </div>
);

const stickerIn = (frame: number, at: number) => {
  const t = interpolate(frame, [at, at + 9], [0, 1], { easing: Easing.out(Easing.back(1.4)), ...clamp });
  return { opacity: Math.min(1, t * 1.4), transform: `scale(${0.82 + t * 0.18}) rotate(${(1 - t) * 8 - 2}deg)` };
};

const Fixed: React.FC<{ font: string; mono: string; frame: number }> = ({ font, mono, frame }) => {
  const rise = interpolate(frame, [2, 12], [28, 0], { easing: snap, ...clamp });
  const stamp = stickerIn(frame, 16);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Window title="agent.log" accent="#fff" width={1080} mono={mono}>
        <div style={{ padding: "54px 64px 64px", transform: `translateY(${rise}px)` }}>
          <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 1.5, color: "#6d6a62" }}>YOUR AGENT SAYS</div>
          <div style={{ fontFamily: font, fontWeight: 700, fontSize: 148, letterSpacing: -5, lineHeight: 0.92, marginTop: 8 }}>Fixed.</div>
          <div style={{ marginTop: 18, display: "inline-block", ...stamp }}>
            <span style={{ display: "inline-block", background: CORAL, color: "#fff", border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `5px 5px 0 ${INK}`, padding: "10px 18px", fontFamily: font, fontWeight: 700, fontSize: 36 }}>
              9.6% still hidden
            </span>
          </div>
        </div>
      </Window>
    </AbsoluteFill>
  );
};

const Stat: React.FC<{ font: string; mono: string; frame: number }> = ({ font, mono, frame }) => {
  const n = interpolate(frame, [88, 118], [0, 9.6], { easing: Easing.out(Easing.cubic), ...clamp });
  const stamp = stickerIn(frame, 114);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 64, letterSpacing: -1.5 }}>
        The checkout button lost{" "}
        <span style={{ display: "inline-block", ...stamp }}>
          <span style={{ background: CORAL, color: "#fff", border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `4px 4px 0 ${INK}`, padding: "2px 14px" }}>
            {n.toFixed(1)}%
          </span>
        </span>
      </div>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 240, letterSpacing: -10, lineHeight: 0.9, color: CORAL, marginTop: 8 }}>
        {n.toFixed(1)}%
      </div>
      <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 3, marginTop: 8 }}>AND THE CENTER PIXEL STILL PASSES</div>
    </AbsoluteFill>
  );
};

const Proof: React.FC<{ font: string; mono: string; frame: number }> = ({ font, mono, frame }) => {
  const rise = interpolate(frame, [160, 178], [16, 0], { easing: glide, ...clamp });
  const push = interpolate(frame, [178, 286], [1, 1.04], { easing: glide, ...clamp });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 54, letterSpacing: -1, marginBottom: 22 }}>Spectra measures the edge.</div>
      <div style={{ transform: `translateY(${rise}px)` }}>
        <Window title="optical viewport  ·  pass 1" accent="#F7D6D2" width={1280} mono={mono}>
          <Img
            src={staticFile("spectra/01-optical-viewport-occlusion.png")}
            style={{ width: 1280, height: 560, objectFit: "cover", objectPosition: "82% 100%", display: "block", transform: `scale(${push})`, transformOrigin: "80% 90%" }}
          />
        </Window>
      </div>
    </AbsoluteFill>
  );
};

const ROWS: { name: string; detail: string; width: number; tone: string }[] = [
  { name: "DOM hit-test", detail: "17 / 18 missed", width: 0.944, tone: CORAL },
  { name: "Flagship VLM", detail: "11 / 18 missed", width: 0.611, tone: "#C9842A" },
  { name: "Spectra", detail: "0 / 18 missed", width: 0.08, tone: GREEN },
];

const Rows: React.FC<{ font: string; mono: string; frame: number }> = ({ font, mono, frame }) => {
  const stamp = stickerIn(frame, 308);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 52, letterSpacing: -1, marginBottom: 22 }}>
        Who catches it{" "}
        <span style={{ display: "inline-block", ...stamp }}>
          <span style={{ background: GREEN, color: "#fff", border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `4px 4px 0 ${INK}`, padding: "2px 12px", fontSize: 36 }}>
            18 / 18
          </span>
        </span>
      </div>
      <Window title="18 occluded clips" accent="#fff" width={1100} mono={mono}>
        <div style={{ padding: "28px 36px 36px", display: "flex", flexDirection: "column", gap: 18 }}>
          {ROWS.map((row, i) => {
            const grow = interpolate(frame, [292 + i * 8, 318 + i * 8], [0, row.width], { easing: glide, ...clamp });
            return (
              <div key={row.name} style={{ display: "grid", gridTemplateColumns: "220px 1fr 180px", alignItems: "center", gap: 16 }}>
                <div style={{ fontFamily: font, fontWeight: 700, fontSize: 26 }}>{row.name}</div>
                <div style={{ height: 28, background: "#E7E2D6", border: `3px solid ${INK}`, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${grow * 100}%`, height: "100%", background: row.tone }} />
                </div>
                <div style={{ fontFamily: mono, fontSize: 18 }}>{row.detail}</div>
              </div>
            );
          })}
        </div>
      </Window>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ font: string; mono: string; frame: number }> = ({ font, mono, frame }) => {
  const mark = stickerIn(frame, 396);
  const word = stickerIn(frame, 404);
  const url = stickerIn(frame, 412);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 64, letterSpacing: -1.5, marginBottom: 28 }}>
        Don’t trust “done.” <span style={{ color: CORAL }}>Measure it.</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ ...mark, background: "#fff", border: `3px solid ${INK}`, borderRadius: 22, boxShadow: `6px 6px 0 ${INK}`, padding: 10 }}>
          <Img src={staticFile("spectra/spectra-logo.svg")} style={{ width: 92, height: 92, display: "block" }} />
        </div>
        <div style={{ ...word, background: GREEN, color: "#fff", border: `3px solid ${INK}`, borderRadius: 22, boxShadow: `8px 8px 0 ${INK}`, padding: "16px 28px", fontFamily: font, fontWeight: 700, fontSize: 84, letterSpacing: -2, lineHeight: 1 }}>
          Spectra
        </div>
      </div>
      <div style={{ marginTop: 28, ...url, background: "#fff", border: `3px solid ${INK}`, borderRadius: 999, boxShadow: `5px 5px 0 ${INK}`, padding: "12px 22px", fontFamily: mono, fontSize: 24 }}>
        spectra-lyart.vercel.app
      </div>
    </AbsoluteFill>
  );
};
