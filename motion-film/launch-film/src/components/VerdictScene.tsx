import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS, COPY } from '../constants';
import { GlobalTopBar, OpticalGrid, RangefinderReticle } from './TelemetryWidgets';

export const VerdictScene: React.FC = () => {
  const frame = useCurrentFrame(); // 0 to 120
  const { fps } = useVideoConfig();

  // Rejection slam spring (frame 0 to 35)
  const rejectSpring = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.4, stiffness: 220 },
  });

  const rejectScale = interpolate(rejectSpring, [0, 1], [1.6, 1]);
  const rejectOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  // Transition to Closed-Loop Repair at frame 35 (approx 1.2s into scene)
  const isRepairPhase = frame >= 35;
  const repairFrame = frame - 35;

  const repairEntrance = spring({
    frame: repairFrame,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 100 },
  });

  // Split-curtain horizontal wipe line (sweeps from 25% to 85% width between repairFrame 15 and 55)
  const wipeProgress = interpolate(repairFrame, [12, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 100% Restored badge entrance (at repairFrame 52)
  const restoredSpring = spring({
    frame: repairFrame - 52,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 150 },
  });

  // Scene transition exit to Brand Reveal
  const sceneOpacity = interpolate(frame, [0, 8, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: BRAND_COLORS.bgDark,
        overflow: 'hidden',
        opacity: sceneOpacity,
      }}
    >
      <GlobalTopBar frame={330 + frame} activeScene={isRepairPhase ? '04 // CLOSED-LOOP REPAIR' : '04 // REFEREE VERDICT'} />

      {/* PHASE 1: REFEREE REJECTION SLAM (Frames 0 to 35) */}
      {!isRepairPhase && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <OpticalGrid opacity={0.35} />

          <div
            style={{
              opacity: rejectOpacity,
              transform: `scale(${rejectScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                fontWeight: 800,
                color: BRAND_COLORS.dangerCoral,
                letterSpacing: '0.14em',
                marginBottom: 16,
                background: 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${BRAND_COLORS.dangerRed}`,
                padding: '6px 18px',
                borderRadius: 4,
              }}
            >
              DUAL-INSTRUMENT REFEREE DECISION
            </div>

            <h1
              style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 130,
                fontWeight: 900,
                color: BRAND_COLORS.dangerCoral,
                margin: 0,
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                textShadow: '0 0 60px rgba(224, 82, 70, 0.6)',
              }}
            >
              {COPY.verdictReject}
            </h1>

            <div
              style={{
                marginTop: 28,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 16,
                color: BRAND_COLORS.textLight,
                background: 'rgba(17, 20, 31, 0.95)',
                border: `1.5px solid ${BRAND_COLORS.dangerRed}`,
                padding: '12px 32px',
                borderRadius: 8,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              <span style={{ color: BRAND_COLORS.dangerRed, fontWeight: 700 }}>VERDICT: REJECTED</span>
              <span style={{ color: BRAND_COLORS.textMuted }}> · </span>
              <span>OCCLUSION 9.6% EXCEEDS SIGMA NOISE (1.35%)</span>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: AUTONOMOUS CLOSED-LOOP REPAIR & SPLIT-CURTAIN WIPE (Frames 35 to 120) */}
      {isRepairPhase && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: repairEntrance,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Closed-Loop Step Progression Banner */}
          <div
            style={{
              position: 'absolute',
              top: 64,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: 'rgba(17, 20, 31, 0.95)',
              border: `1px solid ${BRAND_COLORS.bgCardBorder}`,
              borderRadius: 30,
              padding: '8px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND_COLORS.dangerRed }} />
              <span style={{ color: BRAND_COLORS.dangerRed, fontWeight: 700 }}>1. VERIFY (FAIL)</span>
            </div>
            <span style={{ color: BRAND_COLORS.textMuted }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND_COLORS.accentBlue }} />
              <span style={{ color: BRAND_COLORS.accentCyan, fontWeight: 700 }}>2. PATCH (CSS MARGIN: 0)</span>
            </div>
            <span style={{ color: BRAND_COLORS.textMuted }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND_COLORS.successEmerald }} />
              <span style={{ color: BRAND_COLORS.successEmerald, fontWeight: 700 }}>3. RE-VERIFY (PASS)</span>
            </div>
          </div>

          {/* Center Interactive Split Screen (Left: Occluded UI, Right: Repaired UI) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
            }}
          >
            {/* Background Base: Occluded UI */}
            <img
              src={staticFile('assets/spectra-clean-ui.png')}
              alt="Occluded UI"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Foreground: Repaired UI with Split Curtain Clip Path */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(0 0 0 ${wipeProgress * 100}%)`,
              }}
            >
              <img
                src={staticFile('assets/spectra-repaired-ui.png')}
                alt="Repaired UI"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* Split Wipe Laser Divider Line */}
            {wipeProgress > 0 && wipeProgress < 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${wipeProgress * 100}%`,
                  width: 3,
                  background: BRAND_COLORS.successEmerald,
                  boxShadow: `0 0 20px ${BRAND_COLORS.successEmerald}, 0 0 40px ${BRAND_COLORS.successEmerald}`,
                  zIndex: 40,
                }}
              >
                {/* Laser Split Handle Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '55%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#181816',
                    border: `2px solid ${BRAND_COLORS.successEmerald}`,
                    borderRadius: 20,
                    padding: '8px 16px',
                    color: BRAND_COLORS.successEmerald,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  AUTONOMOUS SPLIT REPAIR
                </div>
              </div>
            )}

            {/* Repaired Target Highlight Box */}
            {repairFrame >= 48 && (
              <RangefinderReticle
                x={909}
                y={600}
                width={342}
                height={51}
                color={BRAND_COLORS.successEmerald}
                label="PASS2 RE-VERIFIED"
                tag="AREA: 17,000 px² (100.0%)"
                pulse={true}
              />
            )}
          </div>

          {/* Lower HUD Banner: "100.0% VISIBILITY RESTORED" */}
          {repairFrame >= 52 && (
            <div
              style={{
                position: 'absolute',
                bottom: 50,
                left: 80,
                background: 'rgba(11, 14, 23, 0.95)',
                border: `2px solid ${BRAND_COLORS.successEmerald}`,
                borderRadius: 12,
                padding: '24px 36px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.25)',
                backdropFilter: 'blur(16px)',
                zIndex: 60,
                transform: `scale(${interpolate(restoredSpring, [0, 1], [0.9, 1])})`,
                opacity: restoredSpring,
                maxWidth: 680,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div
                  style={{
                    background: BRAND_COLORS.successEmerald,
                    color: '#090B10',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}
                >
                  RE-VERIFICATION COMPLETE
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: BRAND_COLORS.textDim }}>
                  SCENARIO S3 CLOSED-LOOP
                </span>
              </div>

              <h2
                style={{
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontSize: 48,
                  fontWeight: 900,
                  color: BRAND_COLORS.successEmerald,
                  margin: '4px 0 8px 0',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                }}
              >
                {COPY.restoredStat}
              </h2>

              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: BRAND_COLORS.textDim,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {COPY.restoredSub} · 0.0% residual occlusion
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
