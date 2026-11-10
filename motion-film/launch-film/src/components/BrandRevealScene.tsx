import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS, COPY } from '../constants';
import { GlobalTopBar, OpticalGrid } from './TelemetryWidgets';

export const BrandRevealScene: React.FC = () => {
  const frame = useCurrentFrame(); // 0 to 90
  const { fps } = useVideoConfig();

  // Logo spring entrance
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 120 },
  });

  const logoScale = interpolate(logoSpring, [0, 1], [0.82, 1]);
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Tagline spring entrance (frame 15)
  const taglineSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 130 },
  });

  // CTA spring entrance (frame 32)
  const ctaSpring = spring({
    frame: frame - 32,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 140 },
  });

  // Scene entrance fade
  const sceneOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 80px',
        boxSizing: 'border-box',
      }}
    >
      <OpticalGrid opacity={0.3} />
      <GlobalTopBar frame={450 + frame} activeScene="05 // SPECTRA V3.0" />

      {/* Center Hero Layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 1200,
          zIndex: 10,
        }}
      >
        {/* Genuine Spectra Rangefinder Logo with Hardware Frame */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            marginBottom: 28,
            position: 'relative',
          }}
        >
          {/* Subtle Outer Glow */}
          <div
            style={{
              position: 'absolute',
              inset: -20,
              background: 'radial-gradient(circle, rgba(46, 125, 82, 0.25) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0,
            }}
          />

          <img
            src={staticFile('assets/spectra-logo.svg')}
            alt="Spectra Logo"
            style={{
              width: 130,
              height: 130,
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.6))',
            }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineSpring,
            transform: `translateY(${interpolate(taglineSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          <h1
            style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: BRAND_COLORS.textLight,
              margin: '0 0 16px 0',
              lineHeight: 1.05,
              textTransform: 'uppercase',
            }}
          >
            {COPY.tagline}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              fontWeight: 700,
              color: BRAND_COLORS.accentCyan,
              letterSpacing: '0.08em',
              marginBottom: 20,
            }}
          >
            <span>{COPY.brandName}</span>
            <span style={{ color: BRAND_COLORS.textMuted }}>//</span>
            <span style={{ color: BRAND_COLORS.textDim }}>{COPY.brandCategory}</span>
          </div>

          {/* Benchmark Credibility Pill */}
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              marginBottom: 36,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${BRAND_COLORS.successEmerald}`,
                padding: '8px 24px',
                borderRadius: 9999,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 800,
                color: BRAND_COLORS.successEmerald,
                letterSpacing: '0.04em',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND_COLORS.successEmerald }} />
              <span>{COPY.benchmarkPill}</span>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: BRAND_COLORS.textMuted,
              }}
            >
              {COPY.benchmarkDisclaimer}
            </span>
          </div>
        </div>

        {/* CTA Launch Card with Live URL & GitHub */}
        <div
          style={{
            opacity: ctaSpring,
            transform: `scale(${interpolate(ctaSpring, [0, 1], [0.92, 1])})`,
            background: 'rgba(17, 20, 31, 0.95)',
            border: `1.5px solid ${BRAND_COLORS.bgCardBorder}`,
            borderRadius: 14,
            padding: '24px 44px',
            display: 'flex',
            alignItems: 'center',
            gap: 36,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.15)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Main CTA Button Style */}
          <div
            style={{
              background: `linear-gradient(135deg, ${BRAND_COLORS.accentBlue}, #1D4ED8)`,
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              padding: '14px 28px',
              borderRadius: 8,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            }}
          >
            <span>{COPY.ctaAction}</span>
            <span>→</span>
          </div>

          {/* Live URL Readout */}
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22,
                fontWeight: 800,
                color: BRAND_COLORS.textLight,
                letterSpacing: '-0.02em',
                marginBottom: 4,
              }}
            >
              {COPY.liveUrl}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: BRAND_COLORS.textMuted,
              }}
            >
              GitHub: {COPY.githubUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
