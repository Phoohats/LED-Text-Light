import { describe, it, expect } from "vitest";
import {
  speedToPxPerSec,
  scrollDurationMs,
  scrollX,
  syncedElapsed,
  travelDistance,
  fitFontSize,
  wallTranslateX,
  syncedPeriodMs,
} from "../src/domain/animation";

describe("animation", () => {
  it("maps speed monotonically", () => {
    expect(speedToPxPerSec(1)).toBeLessThan(speedToPxPerSec(10));
  });

  it("clamps speed knob to 1..10", () => {
    expect(speedToPxPerSec(0)).toBe(speedToPxPerSec(1));
    expect(speedToPxPerSec(99)).toBe(speedToPxPerSec(10));
  });

  it("rtl starts just off the right edge at t=0", () => {
    const cw = 1000;
    expect(scrollX(0, 500, cw, 5, "rtl")).toBeCloseTo(cw);
  });

  it("ltr starts just off the left edge at t=0", () => {
    const tw = 500;
    expect(scrollX(0, tw, 1000, 5, "ltr")).toBeCloseTo(-tw);
  });

  it("loops: position at one full duration equals position at start", () => {
    const tw = 500, cw = 1000, speed = 5;
    const dur = scrollDurationMs(tw, cw, speed);
    expect(scrollX(dur, tw, cw, speed, "rtl")).toBeCloseTo(scrollX(0, tw, cw, speed, "rtl"));
  });

  it("travel distance = text + container", () => {
    expect(travelDistance(300, 700)).toBe(1000);
  });

  it("syncedElapsed subtracts start and skew", () => {
    expect(syncedElapsed(5000, 1000, 200)).toBe(3800);
  });

  it("fitFontSize shrinks text that overflows the width", () => {
    // base 100px, text 2000px wide in a 1000px container (94% = 940 max)
    expect(fitFontSize(2000, 1000, 100)).toBeCloseTo((100 * 940) / 2000); // 47
  });

  it("fitFontSize keeps base size when text already fits", () => {
    expect(fitFontSize(500, 1000, 100)).toBe(100);
  });

  it("fitFontSize is safe on zero measurements", () => {
    expect(fitFontSize(0, 1000, 80)).toBe(80);
    expect(fitFontSize(500, 0, 80)).toBe(80);
  });

  it("wallTranslateX: a single screen equals the normal scroll", () => {
    const W = 1000, tw = 600, t = 1234;
    expect(wallTranslateX(t, tw, W, 1, 1, 5, "rtl")).toBeCloseTo(scrollX(t, tw, W, 5, "rtl"));
  });

  it("wallTranslateX: adjacent screens are offset by exactly one screen width", () => {
    const W = 1000, tw = 600, t = 1234;
    const s1 = wallTranslateX(t, tw, W, 1, 3, 5, "rtl");
    const s2 = wallTranslateX(t, tw, W, 2, 3, 5, "rtl");
    expect(s1 - s2).toBeCloseTo(W); // screen 2 shows the strip shifted left by W
  });

  it("syncedPeriodMs is device-independent: faster speed → shorter period", () => {
    expect(syncedPeriodMs(20, 8)).toBeLessThan(syncedPeriodMs(20, 2));
    expect(syncedPeriodMs(40, 5)).toBeCloseTo(2 * syncedPeriodMs(20, 5)); // scales with length
  });

  it("scrollX honors an explicit periodMs (so different screens share a phase)", () => {
    const p = syncedPeriodMs(10, 5);
    // same periodMs + same elapsed → same progress on two different geometries
    const a = scrollX(p / 2, 800, 1000, 5, "rtl", p); // progress 0.5 → containerW - 0.5*(800+1000)
    expect(a).toBeCloseTo(1000 - 0.5 * 1800);
    const b = scrollX(p / 2, 400, 600, 5, "rtl", p); // progress 0.5 → containerW - 0.5*(400+600)
    expect(b).toBeCloseTo(600 - 0.5 * 1000);
    // loop check: at one full period it returns to the start position
    expect(scrollX(p, 800, 1000, 5, "rtl", p)).toBeCloseTo(scrollX(0, 800, 1000, 5, "rtl", p));
  });

  it("wallTranslateX: bezel widens the per-screen offset", () => {
    const W = 1000, tw = 600, t = 1234, bezel = 40;
    const s1 = wallTranslateX(t, tw, W, 1, 3, 5, "rtl", bezel);
    const s2 = wallTranslateX(t, tw, W, 2, 3, 5, "rtl", bezel);
    expect(s1 - s2).toBeCloseTo(W + bezel);
  });
});
