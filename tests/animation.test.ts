import { describe, it, expect } from "vitest";
import {
  speedToPxPerSec,
  scrollDurationMs,
  scrollX,
  syncedElapsed,
  travelDistance,
  fitFontSize,
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
});
