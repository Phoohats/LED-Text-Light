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
 * Device-INDEPENDENT loop period (ms) for synced *mirror* playback. Based on the
 * message length + speed (a chars/sec feel), NOT screen pixels — so a PC and an
 * iPad of different sizes stay phase-aligned (bigger text just moves faster in px
 * to keep the same reading pace). The video wall keeps geometry-based timing
 * because its tiles are identical devices.
 */
export function syncedPeriodMs(charCount: number, speed: number): number {
  const charsPerSec = Math.max(1, speed) * 1.2; // speed 1..10 → 1.2..12 chars/s
  return (Math.max(1, charCount) / charsPerSec) * 1000;
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
  direction: Direction,
  periodMs?: number // override the loop period (synced mirror passes a device-independent one)
): number {
  const durationMs = periodMs ?? scrollDurationMs(textWidth, containerWidth, speed);
  if (durationMs <= 0) return containerWidth;
  const dist = travelDistance(textWidth, containerWidth);
  const progress = (((elapsedMs % durationMs) + durationMs) % durationMs) / durationMs;
  return direction === "rtl"
    ? containerWidth - progress * dist
    : -textWidth + progress * dist;
}

/**
 * Video-wall: this screen is tile `index` of `count` placed side by side. The
 * text scrolls across one virtual strip spanning all screens (+bezel gaps); each
 * screen renders the same strip windowed at its own offset, so a glyph leaving
 * screen 1's edge enters screen 2. Pure & testable. (assumes equal screen widths)
 */
export function wallTranslateX(
  elapsedMs: number,
  textWidth: number,
  screenWidth: number,
  index: number, // 1-based
  count: number,
  speed: number,
  direction: Direction,
  bezelPx = 0
): number {
  const unit = screenWidth + bezelPx;
  const virtualWidth = count * screenWidth + (count - 1) * bezelPx;
  const virtualX = scrollX(elapsedMs, textWidth, virtualWidth, speed, direction);
  return virtualX - (index - 1) * unit;
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
