import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS, COPY } from '../constants';
import { GlobalTopBar, OpticalGrid } from './TelemetryWidgets';

export const InstrumentScene: React.FC = () => {
  const frame = useCurrentFrame(); // 0 to 150
  const { fps } = useVideoConfig();

  // Entrance & Exit transitions
  const sceneOpacity = interpolate(frame, [0, 10, 140, 150], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline spring
  const headlineSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 120 },
  });

  // Instrument A (SAM 3.1) entrance
  const instASpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 100 },
  });

  // Instrument B (Pixel Template Match) entrance at frame 70 (approx 2.3s into scene)
  const instBSpring = spring({
    frame: frame - 65,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 100 },
  });

  // Convergence Referee card entrance at frame 110 (approx 3.6s into scene)
  const convSpring = spring({
    frame: frame - 110,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 140 },
  });

  // 8-frame SAM tracking steps (t_0 to t_7)
  const samAreas = [17299, 17258, 17273, 16665, 16130, 15756, 15759, 15708];
  const maxArea = 17299;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: BRAND_COLORS.bgDark,
        overflow: 'hidden',
        opacity: sceneOpacity,
        display: 'flex',
        flexDirection: 'column',
        padding: '72px 80px 40px 80px',
        boxSizing: 'border-box',
      }}
    >
      <OpticalGrid opacity={0.3} />
      <GlobalTopBar frame={180 + frame} activeScene="03 // DUAL-INSTRUMENT REFEREE" />

      {/* Main Top Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 36,
          transform: `translateY(${interpolate(headlineSpring, [0, 1], [-20, 0])}px)`,
          opacity: headlineSpring,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: BRAND_COLORS.accentCyan,
            letterSpacing: '0.12em',
            marginBottom: 6,
          }}
        >
          DUAL-INSTRUMENT OPTICAL CROSS-EXAMINATION
        </div>
        <h1
          style={{
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: BRAND_COLORS.textLight,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {COPY.instrumentsHeader}
        </h1>
      </div>

      {/* Two Instruments Split Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          flex: 1,
          maxHeight: 520,
        }}
      >
        {/* Instrument A: SAM 3.1 */}
        <div
          style={{
            background: 'rgba(17, 20, 31, 0.92)',
            border: `1.5px solid ${frame >= 25 ? BRAND_COLORS.successEmerald : BRAND_COLORS.bgCardBorder}`,
            borderRadius: 16,
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: frame >= 25 ? '0 10px 40px rgba(16, 185, 129, 0.15)' : 'none',
            transform: `translateY(${interpolate(instASpring, [0, 1], [30, 0])}px)`,
            opacity: instASpring,
            transition: 'border 0.3s ease',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 800,
                  color: BRAND_COLORS.successEmerald,
                  background: BRAND_COLORS.successBg,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: `1px solid ${BRAND_COLORS.successEmerald}`,
                }}
              >
                INSTRUMENT 01
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: BRAND_COLORS.textDim }}>
                META SAM 3.1 API
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 38,
                fontWeight: 900,
                color: BRAND_COLORS.textLight,
                margin: '0 0 6px 0',
              }}
            >
              {COPY.instrumentAName}
            </h2>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: BRAND_COLORS.textDim, marginBottom: 24 }}>
              {COPY.instrumentADesc}
            </div>

            {/* SAM 8-Frame Bar Chart Progression */}
            <div style={{ background: '#090B10', border: `1px solid ${BRAND_COLORS.bgCardBorder}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: BRAND_COLORS.textMuted, marginBottom: 12 }}>
                <span>FRAME-BY-FRAME SEGMENTATION AREA</span>
                <span style={{ color: BRAND_COLORS.dangerCoral }}>t_7 LOSS: -9.2%</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', height: 90, gap: 10 }}>
                {samAreas.map((area, idx) => {
                  const barFrameTarget = 20 + idx * 5;
                  const isBarVisible = frame >= barFrameTarget;
                  const barH = isBarVisible ? (area / maxArea) * 100 : 0;
                  const isDrop = idx >= 3;

                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${barH}%`,
                          background: isDrop
                            ? `linear-gradient(180deg, ${BRAND_COLORS.dangerCoral}, #B91C1C)`
                            : `linear-gradient(180deg, ${BRAND_COLORS.successEmerald}, #047857)`,
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.2s ease-out',
                        }}
                      />
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: BRAND_COLORS.textMuted, marginTop: 6 }}>
                        t_{idx}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: `1px solid ${BRAND_COLORS.bgCardBorder}`,
              paddingTop: 16,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          >
            <span style={{ color: BRAND_COLORS.textMuted }}>SAM RATIO r_sam:</span>
            <span style={{ color: BRAND_COLORS.dangerCoral, fontWeight: 800 }}>0.9080 (FAIL)</span>
          </div>
        </div>

        {/* Instrument B: PIXEL TEMPLATE MATCH */}
        <div
          style={{
            background: 'rgba(17, 20, 31, 0.92)',
            border: `1.5px solid ${frame >= 80 ? BRAND_COLORS.accentCyan : BRAND_COLORS.bgCardBorder}`,
            borderRadius: 16,
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: frame >= 80 ? '0 10px 40px rgba(6, 182, 212, 0.15)' : 'none',
            transform: `translateY(${interpolate(instBSpring, [0, 1], [30, 0])}px)`,
            opacity: instBSpring,
            transition: 'border 0.3s ease',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 800,
                  color: BRAND_COLORS.accentCyan,
                  background: 'rgba(6, 182, 212, 0.15)',
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: `1px solid ${BRAND_COLORS.accentCyan}`,
                }}
              >
                INSTRUMENT 02
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: BRAND_COLORS.textDim }}>
                PIXEL MATCH
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 38,
                fontWeight: 900,
                color: BRAND_COLORS.textLight,
                margin: '0 0 6px 0',
              }}
            >
              {COPY.instrumentBName}
            </h2>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: BRAND_COLORS.textDim, marginBottom: 24 }}>
              {COPY.instrumentBDesc}
            </div>

            {/* Deterministic Pixel Metric Breakdown */}
            <div style={{ background: '#090B10', border: `1px solid ${BRAND_COLORS.bgCardBorder}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: BRAND_COLORS.textMuted, marginBottom: 14 }}>
                <span>NORMALIZED CORRELATION MATRIX</span>
                <span style={{ color: BRAND_COLORS.dangerCoral }}>r_ncc: 0.5241</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <div style={{ background: 'rgba(17, 20, 31, 0.7)', padding: '10px 14px', borderRadius: 6, border: '1px solid #1E2333' }}>
                  <div style={{ color: BRAND_COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>UNCHANGED PIXELS</div>
                  <div style={{ color: BRAND_COLORS.textLight, fontSize: 16, fontWeight: 800 }}>15,300 px</div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: 6, border: `1px solid ${BRAND_COLORS.dangerRed}` }}>
                  <div style={{ color: BRAND_COLORS.dangerRed, fontSize: 10, marginBottom: 4 }}>OCCLUDED PIXELS</div>
                  <div style={{ color: BRAND_COLORS.dangerRed, fontSize: 16, fontWeight: 800 }}>1,700 px (10.0%)</div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: `1px solid ${BRAND_COLORS.bgCardBorder}`,
              paddingTop: 16,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          >
            <span style={{ color: BRAND_COLORS.textMuted }}>MEASURED PIXEL LOSS:</span>
            <span style={{ color: BRAND_COLORS.dangerCoral, fontWeight: 800 }}>10.00% (FAIL)</span>
          </div>
        </div>
      </div>

      {/* Convergence Banner Docked at Bottom */}
      {frame >= 110 && (
        <div
          style={{
            marginTop: 20,
            background: 'rgba(11, 14, 23, 0.96)',
            border: `2px solid ${BRAND_COLORS.accentBlue}`,
            borderRadius: 12,
            padding: '16px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(59, 130, 246, 0.25)',
            transform: `scale(${interpolate(convSpring, [0, 1], [0.95, 1])})`,
            opacity: convSpring,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: BRAND_COLORS.accentBlue, boxShadow: `0 0 10px ${BRAND_COLORS.accentBlue}` }} />
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 800, color: BRAND_COLORS.textLight }}>
              SPECTRA REFEREE: DUAL-INSTRUMENT CONVERGENCE
            </div>
          </div>

          <div style={{ display: 'flex', gap: 32, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
            <div>
              <span style={{ color: BRAND_COLORS.textMuted }}>DISAGREEMENT: </span>
              <span style={{ color: BRAND_COLORS.accentCyan, fontWeight: 700 }}>0.80% &lt; NOISE FLOOR</span>
            </div>
            <div>
              <span style={{ color: BRAND_COLORS.textMuted }}>COMBINED CONFIDENCE: </span>
              <span style={{ color: BRAND_COLORS.successEmerald, fontWeight: 800 }}>1.000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
