// Keep the screen awake during a show via NoSleep.js — it uses the Screen Wake
// Lock API where available and falls back to a muted inline <video> (the only
// reliable trick on iOS Safari).
//
// CRITICAL: enable() must run inside a user gesture (the "เริ่มโชว์" tap). So the
// caller must invoke this synchronously, BEFORE any await (requestFullscreen /
// orientation.lock), or iOS rejects the video play and the screen still sleeps.
import NoSleep from "nosleep.js";

let noSleep: { enable(): void; disable(): void } | null = null;
let on = false;

export function requestWakeLock(): void {
  try {
    if (!noSleep) noSleep = new NoSleep();
    if (!on) {
      noSleep.enable(); // within the user gesture
      on = true;
    }
  } catch {
    /* unsupported — give up silently; the sign still scrolls */
  }
}

export function releaseWakeLock(): void {
  try {
    noSleep?.disable();
  } catch {
    /* ignore */
  }
  on = false;
}
