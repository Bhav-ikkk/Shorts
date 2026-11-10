import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS, COPY } from '../constants';
import { GlobalTopBar, OpticalGrid, RangefinderReticle } from './TelemetryWidgets';

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame(); // frame relative to scene start (0 to 90)
  const { fps } = useVideoConfig();

  // Camera zoom-in from whole UI (scale 1.0) into the checkout button focus area (scale 1.65, centered around x: 1080, y: 620)
  const cameraZoomSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 80 },
  });

  const cameraScale = interpolate(cameraZoomSpring, [0, 1], [1.02, 1.55]);
  const cameraX = interpolate(cameraZoomSpring, [0, 1], [0, -220]);
  const cameraY = interpolate(cameraZoomSpring, [0, 1], [0, -140]);

  // Red mask reveal animation (frames 20 - 45)
  const maskProgress = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Stamp "9.6% VISIBILITY LOSS" at frame 45 (1.5s into scene)
  const stampSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 160 },
  });

  const stampScale = interpolate(stampSpring, [0, 1], [1.3, 1]);
  const stampOpacity = interpolate(frame, [45, 52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Entrance & Exit transitions
  const sceneOpacity = interpolate(frame, [0, 10, 80, 90], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

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
      <GlobalTopBar frame={90 + frame} activeScene="02 // THE FAILURE DETECTED" />

      {/* Main UI Camera Viewport */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '55% 58%',
          transform: `scale(${cameraScale}) translate(${cameraX}px, ${cameraY}px)`,
        }}
      >
        {/* Genuine Spectra Workbench UI Screenshot */}
        <img
          src={staticFile('assets/spectra-clean-ui.png')}
          alt="Spectra Workbench UI"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Animated Red Occlusion Mask over the Target Checkout Area */}
        {frame >= 20 && (
          <>
            {/* Full button bounding box */}
            <RangefinderReticle
              x={909}
              y={600}
              width={342}
              height={51}
              color={BRAND_COLORS.dangerCoral}
              label="TARGET: #checkout-button"
              tag="t_7 AREA: 15,708 px²"
              pulse={frame >= 45}
            />

            {/* Occluded bottom boundary strip (10% edge occlusion) */}
            <div
              style={{
                position: 'absolute',
                left: 909,
                top: 641,
                width: 342 * maskProgress,
                height: 10,
                background: 'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.75), rgba(239, 68, 68, 0.75) 6px, rgba(185, 28, 28, 0.9) 6px, rgba(185, 28, 28, 0.9) 12px)',
                border: `1.5px solid ${BRAND_COLORS.dangerRed}`,
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: -8,
                  top: -18,
                  background: BRAND_COLORS.dangerRed,
                  color: '#FFFFFF',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '1px 4px',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                OCCLUDED 10%
              </div>
            </div>

            {/* Center pixel indicator (which falsely passed) */}
            <div
              style={{
                position: 'absolute',
                left: 1080 - 6,
                top: 625 - 6,
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid #10B981',
                background: 'rgba(16, 185, 129, 0.4)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  top: -8,
                  background: 'rgba(9, 10, 15, 0.85)',
                  border: '1px solid #10B981',
                  color: '#10B981',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 3,
                  whiteSpace: 'nowrap',
                }}
              >
                CENTER (1080, 625) [DOM PASS]
              </div>
            </div>
          </>
        )}
      </div>

      <OpticalGrid opacity={0.25} />

      {/* Primary Floating HUD Banner: "9.6% VISIBILITY LOSS" */}
      {frame >= 45 && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 70,
            opacity: stampOpacity,
            transform: `scale(${stampScale})`,
            background: 'rgba(11, 14, 23, 0.94)',
            border: `2px solid ${BRAND_COLORS.dangerRed}`,
            borderRadius: 12,
            padding: '28px 40px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.25)',
            backdropFilter: 'blur(16px)',
            zIndex: 90,
            maxWidth: 680,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                background: BRAND_COLORS.dangerRed,
                color: '#FFFFFF',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                padding: '3px 10px',
                borderRadius: 4,
              }}
            >
              OPTICAL DEFECT DETECTED
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: BRAND_COLORS.textDim,
              }}
            >
              CANONICAL BENCHMARK S3
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 54,
              fontWeight: 900,
              color: BRAND_COLORS.dangerCoral,
              margin: '6px 0 12px 0',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
            }}
          >
            {COPY.lossStat}
          </h2>

          {/* Technical Telemetry Readout Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 24px',
              borderTop: `1px solid ${BRAND_COLORS.bgCardBorder}`,
              paddingTop: 16,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: BRAND_COLORS.textMuted }}>BASELINE t_0: </span>
              <span style={{ color: BRAND_COLORS.textLight, fontWeight: 700 }}>17,299 px²</span>
            </div>
            <div>
              <span style={{ color: BRAND_COLORS.textMuted }}>OBSERVED t_7: </span>
              <span style={{ color: BRAND_COLORS.dangerRed, fontWeight: 700 }}>15,708 px² (-9.2%)</span>
            </div>
            <div>
              <span style={{ color: BRAND_COLORS.textMuted }}>DOM HIT-TEST: </span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>PASS (FALSE PASS)</span>
            </div>
            <div>
              <span style={{ color: BRAND_COLORS.textMuted }}>THRESHOLD δ: </span>
              <span style={{ color: BRAND_COLORS.accentCyan, fontWeight: 700 }}>1.35% (EXCEEDED)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
