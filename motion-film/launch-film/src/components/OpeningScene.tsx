import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS, COPY, SCENE_TIMINGS } from '../constants';
import { GlobalTopBar, OpticalGrid } from './TelemetryWidgets';

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typography animation for "AI AGENT: FIXED."
  const claimSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 120 },
  });

  const claimScale = interpolate(claimSpring, [0, 1], [0.88, 1]);
  const claimOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Terminal command typing progress
  const terminalText = '> agent.verify("checkout_drawer") => ALL TESTS PASS (0 ERR)';
  const charsShown = Math.min(terminalText.length, Math.floor(interpolate(frame, [4, 28], [0, terminalText.length], { extrapolateRight: 'clamp' })));

  // Glitch cut to "BUT IS IT?" at frame 45 (1.5s)
  const isInterrupted = frame >= SCENE_TIMINGS.scene1.textCutFrame;

  const counterSpring = spring({
    frame: frame - SCENE_TIMINGS.scene1.textCutFrame,
    fps,
    config: { damping: 12, mass: 0.4, stiffness: 180 },
  });

  const counterScale = interpolate(counterSpring, [0, 1], [1.15, 1]);

  // Overall exit transition to Scene 2 (fade + slight scale-up push)
  const sceneExit = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoomPush = interpolate(frame, [75, 90], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: BRAND_COLORS.bgDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: sceneExit,
        transform: `scale(${zoomPush})`,
      }}
    >
      <OpticalGrid opacity={0.35} />
      <GlobalTopBar frame={frame} activeScene="01 // THE CLAIM" />

      {/* Terminal Agent Command Readout */}
      <div
        style={{
          position: 'absolute',
          top: 180,
          background: 'rgba(17, 20, 31, 0.85)',
          border: `1px solid ${BRAND_COLORS.bgCardBorder}`,
          borderRadius: 8,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          color: BRAND_COLORS.textDim,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND_COLORS.accentBlue }} />
        <span>{terminalText.slice(0, charsShown)}</span>
        {frame < 35 && <span style={{ opacity: Math.floor(frame / 6) % 2 === 0 ? 1 : 0 }}>_</span>}
      </div>

      {/* Center Stage: The Claim or The Interruption */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {!isInterrupted ? (
          <div
            style={{
              opacity: claimOpacity,
              transform: `scale(${claimScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 92,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: BRAND_COLORS.textLight,
                margin: 0,
                lineHeight: 1.05,
                textTransform: 'uppercase',
              }}
            >
              {COPY.claim}
            </h1>

            <div
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 20px',
                borderRadius: 9999,
                background: 'rgba(59, 130, 246, 0.12)',
                border: `1px solid rgba(59, 130, 246, 0.3)`,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                fontWeight: 600,
                color: BRAND_COLORS.accentCyan,
                letterSpacing: '0.04em',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND_COLORS.accentCyan }} />
              <span>DOM LOCATORS: PASS · ACCESSIBILITY TREE: PASS</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              opacity: interpolate(counterSpring, [0, 0.3], [0, 1]),
              transform: `scale(${counterScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 110,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: BRAND_COLORS.dangerCoral,
                margin: 0,
                lineHeight: 1.05,
                textTransform: 'uppercase',
                textShadow: `0 0 40px rgba(224, 82, 70, 0.45)`,
              }}
            >
              {COPY.counterClaim}
            </h1>

            <div
              style={{
                marginTop: 28,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 15,
                fontWeight: 700,
                color: BRAND_COLORS.dangerRed,
                background: 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${BRAND_COLORS.dangerRed}`,
                padding: '10px 28px',
                borderRadius: 6,
                letterSpacing: '0.06em',
              }}
            >
              <span>HIT-TEST CENTER (1080, 625): PASSED</span>
              <span style={{ fontSize: 13, color: BRAND_COLORS.textDim, fontWeight: 500 }}>
                SUBTLE EDGE OCCLUSION INVISIBLE TO STANDARD QA
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Optical Scan Line during interruption */}
      {isInterrupted && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${interpolate(frame - SCENE_TIMINGS.scene1.textCutFrame, [0, 20], [0, 100])}%`,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${BRAND_COLORS.dangerCoral}, transparent)`,
            boxShadow: `0 0 15px ${BRAND_COLORS.dangerCoral}`,
            opacity: interpolate(frame - SCENE_TIMINGS.scene1.textCutFrame, [0, 20], [0.9, 0]),
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
