// Domain core — scroll-timing math + clock-sync. Pure & unit-testable. (ADR-0006)
import type { Direction } from "./sign";

/** Map the 1..10 speed knob to px/second. */
export function speedToPxPerSec(speed: number): number {
  const clamped = Math.min(10, Math.max(1, speed));
  return 60 + clamped * 90; // 150 .. 960 px/s
}

/** Distance the text travels for one full pass (enter right → exit left). */
export function travelDistance(textWidth: number, containerWidth: number): number {
  return textWidth + containerWidth;
}

export function scrollDurationMs(textWidth: number, containerWidth: number, speed: number): number {
  const px = speedToPxPerSec(speed);
  return (travelDistance(textWidth, containerWidth) / px) * 1000;
}

/**
 * translateX (px) for a given elapsed time, looping forever.
 * rtl: starts just off the right edge, moves to just off the left.
 */
export function scrollX(
  elapsedMs: number,
  textWidth: number,
  containerWidth: number,
  speed: number,
  direction: Direction
): number {
  const durationMs = scrollDurationMs(textWidth, containerWidth, speed);
  if (durationMs <= 0) return containerWidth;
  const dist = travelDistance(textWidth, containerWidth);
  const progress = (((elapsedMs % durationMs) + durationMs) % durationMs) / durationMs;
  return direction === "rtl"
    ? containerWidth - progress * dist
    : -textWidth + progress * dist;
}

/**
 * Static/blink fit: shrink the font so a non-scrolling message fits the screen
 * width. Width scales linearly with font size, so the ratio is exact. Returns
 * baseSize unchanged when the text already fits (never enlarges). Pure & testable.
 */
export function fitFontSize(
  textWidth: number,
  containerWidth: number,
  baseSizePx: number,
  maxFraction = 0.94
): number {
  if (textWidth <= 0 || containerWidth <= 0) return baseSizePx;
  const maxW = containerWidth * maxFraction;
  return textWidth > maxW ? (baseSizePx * maxW) / textWidth : baseSizePx;
}

/**
 * Phase 3 sync: a Viewer computes its elapsed time from the Controller's
 * server start timestamp, corrected by the measured clock skew. Keeping this
 * here means the same animation engine drives both single & synced modes.
 */
export function syncedElapsed(now: number, startedAt: number, clockSkew = 0): number {
  return now - startedAt - clockSkew;
}
