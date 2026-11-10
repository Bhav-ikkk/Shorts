import { Easing, interpolate } from "remotion";

/** Premium signature. No overshoot. */
export const premium = Easing.bezier(0.4, 0, 0.2, 1);
/** Entrance: decelerate. */
export const arrive = Easing.bezier(0.16, 1, 0.3, 1);
/** Exit: accelerate. */
export const leave = Easing.bezier(0.4, 0, 1, 1);
/** On-screen camera. */
export const glide = Easing.bezier(0.45, 0.02, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const progress = (frame: number, from: number, to: number, easing = premium) =>
  interpolate(frame, [from, to], [0, 1], { easing, ...clamp });

export const fade = (frame: number, enterAt: number, exitAt: number, dur = 10) => {
  const inn = interpolate(frame, [enterAt, enterAt + dur], [0, 1], { easing: arrive, ...clamp });
  const out = interpolate(frame, [exitAt - dur, exitAt], [1, 0], { easing: leave, ...clamp });
  return Math.min(inn, out);
};
