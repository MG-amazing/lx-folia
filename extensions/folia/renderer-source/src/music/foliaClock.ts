/** Interpolate briefly between native samples; a stalled bridge must not keep singing. */
export const FOLIA_MAX_EXTRAPOLATION_SECONDS = 0.25;
export function foliaClockPosition(anchor: {t: number; at: number}, now: number, playing: boolean): number {
  return anchor.t + (playing ? Math.min(Math.max(0, (now - anchor.at) / 1000), FOLIA_MAX_EXTRAPOLATION_SECONDS) : 0);
}
