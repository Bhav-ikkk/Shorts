import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { BRAND_COLORS } from './constants';

const FONT = "'Bahnschrift', 'Segoe UI', sans-serif";
const MONO = "'Cascadia Mono', 'Consolas', monospace";

const pad = 76;

export const XFeedFilm: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND_COLORS.bgDark, fontFamily: FONT, color: BRAND_COLORS.textLight }}>
      <Grid />
      <Beat frame={frame} from={0} dur={72}>
        <FixedBeat />
      </Beat>
      <Beat frame={frame} from={72} dur={78}>
        <LiedBeat />
      </Beat>
      <Beat frame={frame} from={150} dur={180}>
        <Scoreboard />
      </Beat>
      <Beat frame={frame} from={330} dur={135}>
        <ProofBeat />
      </Beat>
      <Beat frame={frame} from={465} dur={81}>
        <RepairBeat />
      </Beat>
      <Beat frame={frame} from={546} dur={54}>
        <EndCard />
      </Beat>
      <Rail frame={frame} />
    </AbsoluteFill>
  );
};

const Beat: React.FC<{ frame: number; from: number; dur: number; children: React.ReactNode }> = ({
  frame,
  from,
  dur,
  children,
}) => {
  if (frame < from || frame >= from + dur) return null;
  const local = frame - from;
  const enter = interpolate(local, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const exit = interpolate(local, [dur - 8, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, exit) }}>
      <LocalFrame.Provider value={local}>{children}</LocalFrame.Provider>
    </AbsoluteFill>
  );
};

const LocalFrame = React.createContext(0);
const useLocal = () => React.useContext(LocalFrame);

const Grid: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage:
        'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
      backgroundSize: '72px 72px',
    }}
  />
);

const Rail: React.FC<{ frame: number }> = ({ frame }) => {
  const marks = [0, 72, 150, 330, 465, 546];
  return (
    <div style={{ position: 'absolute', top: 96, left: pad, right: pad, display: 'flex', gap: 8 }}>
      {marks.map((m, i) => {
        const next = marks[i + 1] ?? 600;
        const on = frame >= m;
        const fill = on ? interpolate(frame, [m, next], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
        return (
          <div key={m} style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${fill * 100}%`, height: '100%', background: frame >= 72 && frame < 465 ? BRAND_COLORS.dangerCoral : BRAND_COLORS.accentCyan }} />
          </div>
        );
      })}
    </div>
  );
};

const Eyebrow: React.FC<{ children: string; color?: string }> = ({ children, color = BRAND_COLORS.accentCyan }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 28,
      letterSpacing: 4,
      color,
      marginBottom: 28,
    }}
  >
    {children}
  </div>
);

const FixedBeat: React.FC = () => {
  const frame = useLocal();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 12, mass: 0.55, stiffness: 140 } });
  const scale = interpolate(slam, [0, 1], [1.18, 1]);
  return (
    <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', padding: `0 ${pad}px` }}>
      <Eyebrow>AI CODING AGENT</Eyebrow>
      <div style={{ fontSize: 168, fontWeight: 700, letterSpacing: -4, lineHeight: 0.9, transform: `scale(${scale})`, transformOrigin: 'left center' }}>
        FIXED.
      </div>
      <div
        style={{
          marginTop: 48,
          alignSelf: 'flex-start',
          background: BRAND_COLORS.successBg,
          color: BRAND_COLORS.successEmerald,
          border: `2px solid ${BRAND_COLORS.successEmerald}`,
          borderRadius: 999,
          padding: '14px 28px',
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 1,
        }}
      >
        ALL TESTS PASS
      </div>
      <div style={{ marginTop: 36, fontFamily: MONO, fontSize: 28, color: BRAND_COLORS.textDim, lineHeight: 1.45 }}>
        center pixel still hits the button
      </div>
    </AbsoluteFill>
  );
};

const LiedBeat: React.FC = () => {
  const frame = useLocal();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 9, mass: 0.45, stiffness: 180 } });
  const scale = interpolate(slam, [0, 1], [1.35, 1]);
  const sub = interpolate(frame, [10, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#140807', flexDirection: 'column', justifyContent: 'center', padding: `0 ${pad}px` }}>
      <Eyebrow color={BRAND_COLORS.dangerCoral}>9.6% EDGE OCCLUSION</Eyebrow>
      <div
        style={{
          fontSize: 156,
          fontWeight: 700,
          letterSpacing: -4,
          lineHeight: 0.9,
          color: BRAND_COLORS.dangerCoral,
          transform: `scale(${scale})`,
          transformOrigin: 'left center',
        }}
      >
        NOT
        <br />
        FIXED.
      </div>
      <div style={{ marginTop: 48, fontSize: 42, lineHeight: 1.25, maxWidth: 860, opacity: sub, color: BRAND_COLORS.bgPutty }}>
        The cart drawer covers the bottom of Complete Checkout. The center pixel never notices.
      </div>
    </AbsoluteFill>
  );
};

const ROWS: { name: string; call: string; detail: string; tone: 'bad' | 'mid' | 'good' }[] = [
  { name: 'DOM HIT-TEST', call: 'PASS', detail: '17 / 18 missed · 94.4%', tone: 'bad' },
  { name: 'FLAGSHIP VLM', call: 'PASS', detail: '11 / 18 missed · 61.1%', tone: 'mid' },
  { name: 'SPECTRA', call: 'REJECT', detail: '0 / 18 missed · 0.0%', tone: 'good' },
];

const Scoreboard: React.FC = () => {
  const frame = useLocal();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', padding: `0 ${pad}px` }}>
      <Eyebrow>18 OCCLUDED CLIPS</Eyebrow>
      <div style={{ fontSize: 78, fontWeight: 700, letterSpacing: -2, lineHeight: 0.95, marginBottom: 48 }}>
        Who actually
        <br />
        catches it.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {ROWS.map((row, i) => {
          const s = spring({ frame: frame - 8 - i * 10, fps, config: { damping: 14, mass: 0.5, stiffness: 140 } });
          const x = interpolate(s, [0, 1], [80, 0]);
          const color = row.tone === 'good' ? BRAND_COLORS.successEmerald : row.tone === 'mid' ? BRAND_COLORS.amberWarning : BRAND_COLORS.dangerCoral;
          return (
            <div
              key={row.name}
              style={{
                opacity: s,
                transform: `translateX(${x}px)`,
                background: '#11141F',
                border: '1px solid #1E2337',
                borderLeft: `8px solid ${color}`,
                borderRadius: 16,
                padding: '26px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 1.5, color: BRAND_COLORS.textDim }}>{row.name}</div>
                <div style={{ fontSize: 30, marginTop: 6, color: BRAND_COLORS.bgPutty }}>{row.detail}</div>
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color }}>{row.call}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 22, color: BRAND_COLORS.textMuted, letterSpacing: 0.4 }}>
        Measured on 18 occluded v1 clips. Not a projection.
      </div>
    </AbsoluteFill>
  );
};

const ProofBeat: React.FC = () => {
  const frame = useLocal();
  const zoom = interpolate(frame, [0, 120], [1.12, 1.28], { extrapolateRight: 'clamp' });
  const stamp = interpolate(frame, [18, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Img
        src={staticFile('assets/spectra-clean-ui.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '64% 42%',
          transform: `scale(${zoom})`,
        }}
      />
      <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(9,10,15,0.94) 0%, rgba(9,10,15,0.2) 38%, rgba(9,10,15,0.35) 100%)' }} />
      <div style={{ position: 'absolute', left: pad, right: pad, bottom: 220, opacity: stamp }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 2, color: BRAND_COLORS.dangerCoral, marginBottom: 12 }}>
          SAM 17,299 px → 15,708 px
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1.5, lineHeight: 0.95 }}>
          9.6% gone.
          <br />
          Still a pass.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RepairBeat: React.FC = () => {
  const frame = useLocal();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 10, mass: 0.4, stiffness: 200 } });
  const scale = interpolate(slam, [0, 1], [1.5, 1]);
  const next = interpolate(frame, [28, 42], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', padding: `0 ${pad}px` }}>
      <div
        style={{
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: -3,
          color: BRAND_COLORS.dangerCoral,
          transform: `scale(${scale})`,
          transformOrigin: 'left center',
        }}
      >
        REJECTED.
      </div>
      <div style={{ marginTop: 36, fontFamily: MONO, fontSize: 32, letterSpacing: 1, color: BRAND_COLORS.textDim, opacity: next }}>
        VERIFY → PATCH → RE-VERIFY
      </div>
      <div style={{ marginTop: 28, fontSize: 58, fontWeight: 700, letterSpacing: -1, color: BRAND_COLORS.successEmerald, opacity: next, lineHeight: 1.05 }}>
        100.0% visibility
        <br />
        restored.
      </div>
      <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 24, color: BRAND_COLORS.textMuted, opacity: next }}>
        Documented S3 repair · 0.00% loss on pass 2
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useLocal();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', padding: `0 ${pad}px`, opacity }}>
      <Eyebrow>SPECTRA V3.0</Eyebrow>
      <div style={{ fontSize: 78, fontWeight: 700, letterSpacing: -2, lineHeight: 0.95 }}>
        Don’t trust “done.”
        <br />
        Measure it.
      </div>
      <div style={{ marginTop: 40, fontFamily: MONO, fontSize: 30, color: BRAND_COLORS.accentCyan }}>
        spectra-lyart.vercel.app
      </div>
      <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 24, color: BRAND_COLORS.textMuted }}>
        18 / 18 occlusions caught
      </div>
    </AbsoluteFill>
  );
};
