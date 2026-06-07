// Keep the screen awake during a show.
// Primary: Screen Wake Lock API (Android/Chrome, recent iOS).
// Fallback: play a tiny muted inline video from a canvas stream — older iOS
// Safari lacks Wake Lock, but playing inline video suppresses auto-lock.
// (Best-effort; reliability varies by iOS version.)
type SentinelLike = { release?: () => Promise<void> };

let sentinel: SentinelLike | null = null;
let fbVideo: HTMLVideoElement | null = null;
let fbRaf = 0;

export async function requestWakeLock(): Promise<void> {
  const wl = (navigator as unknown as { wakeLock?: { request(t: string): Promise<SentinelLike> } }).wakeLock;
  if (wl) {
    try {
      sentinel = await wl.request("screen");
      return;
    } catch {
      /* fall through to video fallback */
    }
  }
  startVideoFallback();
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await sentinel?.release?.();
  } catch {
    /* ignore */
  }
  sentinel = null;
  stopVideoFallback();
}

function startVideoFallback(): void {
  if (fbVideo) return;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2;
    const ctx = canvas.getContext("2d");
    const stream = (canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }).captureStream?.(1);
    if (!stream) return;
    const v = document.createElement("video");
    v.muted = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("aria-hidden", "true");
    v.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0";
    v.srcObject = stream;
    document.body.appendChild(v);
    const tick = (): void => {
      if (ctx) ctx.fillRect(0, 0, 2, 2);
      fbRaf = requestAnimationFrame(tick);
    };
    tick();
    void v.play().catch(() => {});
    fbVideo = v;
  } catch {
    /* unsupported — give up silently */
  }
}

function stopVideoFallback(): void {
  cancelAnimationFrame(fbRaf);
  fbRaf = 0;
  if (fbVideo) {
    fbVideo.pause();
    fbVideo.srcObject = null;
    fbVideo.remove();
    fbVideo = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && sentinel === null && !fbVideo) void requestWakeLock();
});
