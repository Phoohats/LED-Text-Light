// Keep the screen awake during a show. Re-acquires when the tab regains focus.
// iOS support is recent; failures are swallowed (graceful — sign still runs).
type SentinelLike = { release?: () => Promise<void> };
let sentinel: SentinelLike | null = null;

export async function requestWakeLock(): Promise<void> {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request(t: string): Promise<SentinelLike> } }).wakeLock;
    if (wl) sentinel = await wl.request("screen");
  } catch {
    /* unsupported or denied — ignore */
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await sentinel?.release?.();
  } catch {
    /* ignore */
  }
  sentinel = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && sentinel === null) void requestWakeLock();
});
