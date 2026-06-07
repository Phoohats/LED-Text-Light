// Fullscreen marquee. Drives the animation via the pure domain math (scrollX),
// so Phase 3 sync just feeds a synced elapsed time instead of local elapsed.
import type { Sign } from "../domain/sign";
import { scrollX, fitFontSize, wallTranslateX } from "../domain/animation";
import { fontStack } from "../config/fonts";
import { requestWakeLock, releaseWakeLock } from "./wakeLock";

/** Synced playback info for a Viewer mirroring a Controller (Phase 3). */
export interface SyncInfo {
  startedAtMs: number; // server time the Controller started this sign
  clockOffsetMs: number; // serverTime - localTime
}

/** Video-wall: this device is tile `index` of `count` in a side-by-side row. */
export interface WallInfo {
  index: number; // 1-based
  count: number;
  bezelPx: number; // gap between screens to skip across (tunable live)
}

export class DisplayView {
  readonly el: HTMLElement;
  private track: HTMLElement;
  private textEl: HTMLElement;
  private sign: Sign | null = null;
  private sync: SyncInfo | null = null;
  private wall: WallInfo | null = null;
  private rafId = 0;
  private startTs = 0;
  private paused = false;
  private onExit: () => void;

  constructor(onExit: () => void) {
    this.onExit = onExit;

    this.el = document.createElement("div");
    this.el.className = "display";

    this.track = document.createElement("div");
    this.track.className = "display__track";
    this.textEl = document.createElement("div");
    this.textEl.className = "display__text";
    this.track.appendChild(this.textEl);
    this.el.appendChild(this.track);

    this.buildControls();

    this.el.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".display__bar")) return;
      this.el.classList.toggle("display--bar-open");
    });
  }

  private buildControls(): void {
    const bar = document.createElement("div");
    bar.className = "display__bar";
    bar.innerHTML = `
      <button data-a="bezel-" aria-label="ลดระยะขอบ">⟵|</button>
      <button data-a="bezel+" aria-label="เพิ่มระยะขอบ">|⟶</button>
      <button data-a="slower" aria-label="ช้าลง">⏪</button>
      <button data-a="pause" aria-label="พัก">⏸</button>
      <button data-a="faster" aria-label="เร็วขึ้น">⏩</button>
      <button data-a="exit" aria-label="ออก">✕ ออก</button>`;
    bar.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-a]") as HTMLElement | null;
      if (!btn) return;
      switch (btn.dataset.a) {
        case "bezel-": this.nudgeBezel(-8); break;
        case "bezel+": this.nudgeBezel(8); break;
        case "slower": this.nudgeSpeed(-1); break;
        case "faster": this.nudgeSpeed(1); break;
        case "pause": this.togglePause(); break;
        case "exit": this.hide(); break;
      }
    });
    this.el.appendChild(bar);
  }

  show(sign: Sign, sync: SyncInfo | null = null): void {
    requestWakeLock(); // sync — must stay inside the user gesture (see wakeLock.ts)
    this.setSign(sign, sync);
    window.addEventListener("resize", this.onResize);
    // web fonts load async; first measure may use a fallback → re-fit when ready
    document.fonts?.ready?.then(() => this.onResize()).catch(() => {});
    this.start();
  }

  /** Update the shown sign live (Viewer mirror). Does not re-arm wake lock/loop. */
  setSign(sign: Sign, sync: SyncInfo | null = null): void {
    this.sign = { ...sign, style: { ...sign.style } };
    this.sync = sync;
    this.apply();
  }

  /** Enter/leave video-wall mode for this tile. Call before show(). */
  setWall(wall: WallInfo | null): void {
    this.wall = wall;
    this.el.classList.toggle("display--wall", Boolean(wall));
  }

  private nudgeBezel(delta: number): void {
    if (this.wall) this.wall.bezelPx = Math.max(0, this.wall.bezelPx + delta);
  }

  private apply(): void {
    if (!this.sign) return;
    const s = this.sign.style;
    this.el.style.background = s.bgColor;
    this.el.dataset.effect = s.effect;
    this.textEl.textContent = this.sign.message;
    this.textEl.style.color = s.color;
    this.textEl.style.fontFamily = fontStack(s.fontFamily);
    this.textEl.style.fontWeight = s.bold ? "700" : "400";
    this.textEl.style.textShadow = s.glow
      ? `0 0 0.14em ${s.color}, 0 0 0.4em ${s.color}, 0 0 0.85em ${s.color}`
      : "none";
    if (s.effect === "blink" || s.effect === "static") {
      this.track.style.transform = "translateX(0)";
      this.fitStatic();
    } else {
      // scroll / rainbow keep the full height-based size and overflow on purpose
      this.textEl.style.fontSize = "";
    }
  }

  /** Shrink a non-scrolling message so it fits the screen width (ADR: DOM render). */
  private fitStatic(): void {
    this.textEl.style.fontSize = ""; // measure at the CSS base size (62vh)
    const base = parseFloat(getComputedStyle(this.textEl).fontSize) || this.el.clientHeight * 0.62;
    const size = fitFontSize(this.textEl.scrollWidth, this.el.clientWidth, base);
    this.textEl.style.fontSize = `${size}px`;
  }

  private readonly onResize = (): void => {
    const fx = this.sign?.style.effect;
    if (fx === "static" || fx === "blink") this.fitStatic();
  };

  private start(): void {
    cancelAnimationFrame(this.rafId);
    this.startTs = performance.now();
    const loop = (ts: number): void => {
      const sign = this.sign;
      if (sign && !this.paused && (sign.style.effect === "scroll" || sign.style.effect === "rainbow")) {
        // Viewer: derive elapsed from the synced server start so all phones align.
        const elapsed = this.sync ? Date.now() + this.sync.clockOffsetMs - this.sync.startedAtMs : ts - this.startTs;
        const containerW = this.el.clientWidth;
        const textW = this.textEl.scrollWidth;
        const st = sign.style;
        const x = this.wall
          ? wallTranslateX(elapsed, textW, containerW, this.wall.index, this.wall.count, st.speed, st.direction, this.wall.bezelPx)
          : scrollX(elapsed, textW, containerW, st.speed, st.direction);
        this.track.style.transform = `translateX(${x}px)`;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private nudgeSpeed(delta: number): void {
    if (!this.sign) return;
    this.sign.style.speed = Math.min(10, Math.max(1, this.sign.style.speed + delta));
  }

  private togglePause(): void {
    this.paused = !this.paused;
    const b = this.el.querySelector('[data-a="pause"]');
    if (b) b.textContent = this.paused ? "▶" : "⏸";
  }

  hide(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    releaseWakeLock();
    window.removeEventListener("resize", this.onResize);
    this.el.classList.remove("display--bar-open");
    this.setWall(null);
    this.onExit();
  }
}
