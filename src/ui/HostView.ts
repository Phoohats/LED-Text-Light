// Controller panel for a synced Show: room code, QR, share link, live viewer
// count, and "push to viewers". Sits as a top sheet so the editor stays usable.
export interface HostHandlers {
  onPush: () => void; // push the editor's current sign to viewers
  onShowLocal: () => void; // also show fullscreen on this device
  onClose: () => void; // end the show
}

export class HostView {
  readonly el: HTMLElement;
  private h: HostHandlers;

  constructor(handlers: HostHandlers) {
    this.h = handlers;
    this.el = document.createElement("div");
    this.el.className = "host";
    this.el.innerHTML = `
      <div class="host__bar">
        <div class="host__code">รหัสห้อง <b id="hCode">----</b></div>
        <div class="host__viewers">👀 <span id="hViewers">0</span></div>
        <button type="button" id="hClose" class="host__x" aria-label="ปิดโชว์">✕</button>
      </div>
      <div class="host__body">
        <canvas id="hQr" width="180" height="180" class="host__qr"></canvas>
        <div class="host__side">
          <div class="host__link">
            <input id="hLink" class="host__linkinput" readonly />
            <button type="button" id="hCopy" class="btn">📋 คัดลอกลิงก์</button>
          </div>
          <button type="button" id="hPush" class="btn btn--primary">▶ ส่งป้ายขึ้นจอผู้ชม</button>
          <button type="button" id="hLocal" class="btn">เปิดบนเครื่องนี้ด้วย</button>
          <p class="host__hint">ให้เพื่อนสแกน QR หรือเข้า <b>led-text-light.web.app</b> แล้วกด “เข้าร่วม” ใส่รหัส</p>
        </div>
      </div>`;

    this.q("#hClose").addEventListener("click", () => this.h.onClose());
    this.q("#hPush").addEventListener("click", () => this.h.onPush());
    this.q("#hLocal").addEventListener("click", () => this.h.onShowLocal());
    this.q("#hCopy").addEventListener("click", () => {
      const link = (this.q("#hLink") as HTMLInputElement).value;
      navigator.clipboard?.writeText(link).then(
        () => this.flash("#hCopy", "✓ คัดลอกแล้ว"),
        () => {}
      );
    });
  }

  show(code: string, link: string): void {
    (this.q("#hCode") as HTMLElement).textContent = code;
    (this.q("#hLink") as HTMLInputElement).value = link;
    this.setViewers(0);
    this.el.classList.add("host--show");
    void this.renderQr(link);
  }

  hide(): void {
    this.el.classList.remove("host--show");
  }

  setViewers(n: number): void {
    (this.q("#hViewers") as HTMLElement).textContent = String(n);
  }

  private async renderQr(link: string): Promise<void> {
    try {
      const QR = (await import("qrcode")).default;
      await QR.toCanvas(this.q("#hQr") as HTMLCanvasElement, link, { width: 180, margin: 1 });
    } catch {
      /* QR optional — code + link still work */
    }
  }

  private flash(sel: string, text: string): void {
    const b = this.q(sel);
    const prev = b.textContent;
    b.textContent = text;
    setTimeout(() => (b.textContent = prev), 1800);
  }

  private q(sel: string): HTMLElement {
    return this.el.querySelector(sel) as HTMLElement;
  }
}
