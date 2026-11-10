export const VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 540, // Exact 18 seconds
};

export const SCENE_TIMINGS = {
  scene1: {
    from: 0,
    duration: 90, // 0.0s – 3.0s: The Claim
    textCutFrame: 45, // "AI AGENT: FIXED." -> "BUT IS IT?"
  },
  scene2: {
    from: 90,
    duration: 90, // 3.0s – 6.0s: The Failure
    maskLockFrame: 125, // Red mask draws and locks
    lossStampFrame: 145, // "9.6% VISIBILITY LOSS" stamps
  },
  scene3: {
    from: 180,
    duration: 150, // 6.0s – 11.0s: The Two Instruments
    instrumentASwitch: 180, // SAM 3.1
    instrumentBSwitch: 255, // Pixel Template Match
    convergenceFrame: 300, // "TWO INSTRUMENTS. ONE VERDICT."
  },
  scene4: {
    from: 330,
    duration: 120, // 11.0s – 15.0s: The Verdict and Repair
    verdictRejectFrame: 330, // "REJECTED."
    repairPipelineFrame: 365, // VERIFY -> PATCH -> RE-VERIFY
    splitWipeStart: 375, // Horizontal wipe starts
    restoredLockFrame: 405, // "100.0% VISIBILITY RESTORED"
  },
  scene5: {
    from: 450,
    duration: 90, // 15.0s – 18.0s: The Brand Reveal
    logoSettleFrame: 470,
    ctaLockFrame: 490,
  },
} as const;

export const BRAND_COLORS = {
  bgDark: '#090A0F',
  bgCardDark: '#11141F',
  bgCardBorder: '#1E2337',
  bgPutty: '#EAE7DF',
  textLight: '#F8FAFC',
  textDim: '#94A3B8',
  textMuted: '#64748B',
  accentBlue: '#3B82F6',
  accentCyan: '#06B6D4',
  accentGlow: 'rgba(59, 130, 246, 0.35)',
  dangerRed: '#EF4444',
  dangerCoral: '#E05246',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  successEmerald: '#10B981',
  successGreen: '#2E7D52',
  successBg: 'rgba(16, 185, 129, 0.15)',
  amberWarning: '#F59E0B',
};

export const COPY = {
  brandName: 'SPECTRA V3.0',
  brandCategory: 'OPTICAL VISUAL REFEREE FOR AI CODING AGENTS',
  tagline: "DON'T TRUST 'DONE.' MEASURE IT.",
  claim: 'AI AGENT: FIXED.',
  counterClaim: 'BUT IS IT?',
  lossStat: '9.6% VISIBILITY LOSS',
  lossSub: 'CENTER-PIXEL HIT-TEST: FALSE PASS · OPTICAL LOSS: 9.6%',
  instrumentsHeader: 'TWO INSTRUMENTS. ONE VERDICT.',
  instrumentAName: 'SAM 3.1',
  instrumentADesc: 'Visual segmentation tracking UI boundaries over time',
  instrumentBName: 'PIXEL TEMPLATE MATCH',
  instrumentBDesc: 'Deterministic normalized cross-correlation verification',
  verdictReject: 'REJECTED.',
  repairSequence: 'VERIFY → PATCH → RE-VERIFY',
  restoredStat: '100.0% VISIBILITY RESTORED',
  restoredSub: 'Documented demonstrated repair scenario · 0px overlap',
  benchmarkPill: '18/18 CANONICAL OCCLUSIONS CAUGHT · 0.0% FALSE-PASS RATE',
  benchmarkDisclaimer: '*Documented canonical benchmark suite (18 occluded v1 clips)',
  ctaAction: 'TRY SPECTRA WORKBENCH',
  liveUrl: 'https://spectra-lyart.vercel.app/',
  githubUrl: 'github.com/Bhav-ikkk/spectra',
};
