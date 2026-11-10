import React from 'react';
import { BRAND_COLORS } from '../constants';

export const OpticalGrid: React.FC<{ opacity?: number }> = ({ opacity = 0.4 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        backgroundImage: `
          linear-gradient(to right, ${BRAND_COLORS.bgCardBorder} 1px, transparent 1px),
          linear-gradient(to bottom, ${BRAND_COLORS.bgCardBorder} 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    >
      {/* Corner crosshairs */}
      <div style={{ position: 'absolute', top: 40, left: 40, width: 20, height: 20, borderLeft: '2px solid #64748B', borderTop: '2px solid #64748B' }} />
      <div style={{ position: 'absolute', top: 40, right: 40, width: 20, height: 20, borderRight: '2px solid #64748B', borderTop: '2px solid #64748B' }} />
      <div style={{ position: 'absolute', bottom: 40, left: 40, width: 20, height: 20, borderLeft: '2px solid #64748B', borderBottom: '2px solid #64748B' }} />
      <div style={{ position: 'absolute', bottom: 40, right: 40, width: 20, height: 20, borderRight: '2px solid #64748B', borderBottom: '2px solid #64748B' }} />
    </div>
  );
};

export const GlobalTopBar: React.FC<{ frame: number; activeScene?: string }> = ({ frame, activeScene }) => {
  const isBlinking = Math.floor(frame / 15) % 2 === 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        background: 'rgba(9, 10, 15, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BRAND_COLORS.bgCardBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        zIndex: 100,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 12,
        color: BRAND_COLORS.textDim,
        letterSpacing: '0.08em',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isBlinking ? BRAND_COLORS.successEmerald : BRAND_COLORS.accentCyan,
            boxShadow: `0 0 10px ${isBlinking ? BRAND_COLORS.successEmerald : BRAND_COLORS.accentCyan}`,
          }}
        />
        <span style={{ fontWeight: 700, color: BRAND_COLORS.textLight }}>SPECTRA // OPTICAL REFEREE</span>
        <span style={{ color: BRAND_COLORS.textMuted }}>SYS.V3.0-OPTICAL</span>
      </div>

      {activeScene && (
        <div
          style={{
            padding: '3px 10px',
            borderRadius: 4,
            background: 'rgba(59, 130, 246, 0.12)',
            border: `1px solid rgba(59, 130, 246, 0.3)`,
            color: BRAND_COLORS.accentCyan,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {activeScene}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 11, color: BRAND_COLORS.textMuted }}>
        <span>σ_NOISE = 0.0135 (CALIBRATED)</span>
        <span>FRAME {String(frame).padStart(3, '0')} / 540</span>
      </div>
    </div>
  );
};

export const RangefinderReticle: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  label?: string;
  tag?: string;
  pulse?: boolean;
}> = ({
  x,
  y,
  width,
  height,
  color = BRAND_COLORS.dangerRed,
  label,
  tag,
  pulse = false,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* 4 Corner brackets */}
      <div style={{ position: 'absolute', top: -2, left: -2, width: 14, height: 14, borderLeft: `3px solid ${color}`, borderTop: `3px solid ${color}` }} />
      <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRight: `3px solid ${color}`, borderTop: `3px solid ${color}` }} />
      <div style={{ position: 'absolute', bottom: -2, left: -2, width: 14, height: 14, borderLeft: `3px solid ${color}`, borderBottom: `3px solid ${color}` }} />
      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRight: `3px solid ${color}`, borderBottom: `3px solid ${color}` }} />

      {/* Center crosshair */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 12, height: 12 }}>
        <div style={{ position: 'absolute', left: 5, top: 0, width: 2, height: 12, background: color, opacity: 0.8 }} />
        <div style={{ position: 'absolute', left: 0, top: 5, width: 12, height: 2, background: color, opacity: 0.8 }} />
      </div>

      {/* Perimeter thin line */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `1.5px solid ${color}`,
          opacity: pulse ? 0.9 : 0.6,
          boxShadow: pulse ? `0 0 16px ${color}` : 'none',
        }}
      />

      {/* Top label tag */}
      {label && (
        <div
          style={{
            position: 'absolute',
            top: -26,
            left: 0,
            background: color,
            color: '#FFFFFF',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '2px 2px 0 0',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}

      {/* Bottom telemetry tag */}
      {tag && (
        <div
          style={{
            position: 'absolute',
            bottom: -24,
            right: 0,
            background: 'rgba(9, 10, 15, 0.9)',
            border: `1px solid ${color}`,
            color: color,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 2,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {tag}
        </div>
      )}
    </div>
  );
};
