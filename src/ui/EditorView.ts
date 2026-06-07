// Editor screen — live preview + all Sign controls + preset management.
import type { Sign, SignStyle, Effect } from "../domain/sign";
import { createSign, DEFAULT_STYLE } from "../domain/sign";
import { FONTS, fontStack } from "../config/fonts";
import type { PresetService } from "../app/presetService";
import type { Preset } from "../domain/ports";

type StartFn = (sign: Sign) => void;

// Concert-friendly quick colors (one tap beats fiddling the native picker).
const SWATCHES = ["#00e5ff", "#ffffff", "#ff2d9b", "#ff3b30", "#ffd60a", "#30d158", "#0a84ff", "#bf5af0"];

export class EditorView {
  readonly el: HTMLElement;
  private style: SignStyle = { ...DEFAULT_STYLE };
  private message = "เป็นกำลังใจให้เสมอ 💙🎤";
  private presetSvc: PresetService;
  private onStart: StartFn;

  constructor(presetSvc: PresetService, onStart: StartFn) {
    this.presetSvc = presetSvc;
    this.onStart = onStart;
    this.el = document.createElement("div");
    this.el.className = "editor";
  }

  init(): void {
    this.render();
  }

  private current(): Sign {
    return createSign(this.message, this.style);
  }

  private render(): void {
    this.el.innerHTML = `
      <header class="topbar">
        <span class="logo">LED <b>Text Light</b></span>
        <span class="tag">ป้ายไฟวิ่ง · ไทย/อังกฤษ/อิโมจิ</span>
      </header>

      <div class="preview" id="prev"><div class="preview__text" id="prevText"></div></div>

      <div class="panel">
        <label class="lbl" for="msg">ข้อความ</label>
        <textarea id="msg" class="input" rows="2" maxlength="200" placeholder="พิมพ์ข้อความ + อิโมจิ 🎉"></textarea>

        <label class="lbl" for="font">ฟอนต์ (10 แบบ)</label>
        <select id="font" class="input"></select>

        <label class="lbl">สีด่วน</label>
        <div class="swatches" id="swatches"></div>

        <div class="row">
          <div class="field"><label class="lbl" for="color">สีตัวอักษร</label><input type="color" id="color" class="color" /></div>
          <div class="field"><label class="lbl" for="bg">สีพื้นหลัง</label><input type="color" id="bg" class="color" /></div>
          <div class="field grow"><label class="lbl" for="speed">ความเร็ว</label><input type="range" id="speed" min="1" max="10" class="range" /></div>
        </div>

        <label class="lbl">เอฟเฟกต์</label>
        <div class="seg" id="effect">
          <button type="button" data-fx="scroll">วิ่ง</button>
          <button type="button" data-fx="blink">กระพริบ</button>
          <button type="button" data-fx="static">นิ่ง</button>
          <button type="button" data-fx="rainbow">สายรุ้ง</button>
        </div>

        <div class="row">
          <button type="button" id="dir" class="chip">ทิศทาง: ←</button>
          <button type="button" id="bold" class="chip">ตัวหนา</button>
          <button type="button" id="glow" class="chip">✨ เรืองแสง</button>
        </div>

        <div class="row actions">
          <button type="button" id="start" class="btn btn--primary">▶ เริ่มโชว์ (เต็มจอ)</button>
          <button type="button" id="save" class="btn">💾 บันทึก</button>
        </div>

        <label class="lbl">พรีเซ็ตที่บันทึก</label>
        <div id="presets" class="presets"></div>
      </div>
    `;

    const fontSel = this.$<HTMLSelectElement>("#font");
    fontSel.innerHTML = FONTS.map((f) => `<option value="${f.id}">${f.label}</option>`).join("");

    this.$("#swatches").innerHTML = SWATCHES.map(
      (c) => `<button type="button" class="sw" data-c="${c}" style="background:${c}" aria-label="สี ${c}"></button>`
    ).join("");

    this.$<HTMLTextAreaElement>("#msg").value = this.message;
    fontSel.value = this.style.fontFamily;
    this.$<HTMLInputElement>("#color").value = this.style.color;
    this.$<HTMLInputElement>("#bg").value = this.style.bgColor;
    this.$<HTMLInputElement>("#speed").value = String(this.style.speed);

    this.wire();
    this.syncToggles();
    this.updatePreview();
    void this.renderPresets();
  }

  private wire(): void {
    this.$("#msg").addEventListener("input", (e) => {
      this.message = (e.target as HTMLTextAreaElement).value;
      this.updatePreview();
    });
    this.$("#font").addEventListener("change", (e) => {
      this.style.fontFamily = (e.target as HTMLSelectElement).value;
      this.updatePreview();
    });
    this.$("#color").addEventListener("input", (e) => {
      this.style.color = (e.target as HTMLInputElement).value;
      this.updatePreview();
    });
    this.$("#bg").addEventListener("input", (e) => {
      this.style.bgColor = (e.target as HTMLInputElement).value;
      this.updatePreview();
    });
    this.$("#speed").addEventListener("input", (e) => {
      this.style.speed = Number((e.target as HTMLInputElement).value);
      this.updatePreview();
    });
    this.$("#effect").addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest("[data-fx]") as HTMLElement | null;
      if (!b) return;
      this.style.effect = b.dataset.fx as Effect;
      this.syncToggles();
      this.updatePreview();
    });
    this.$("#dir").addEventListener("click", () => {
      this.style.direction = this.style.direction === "rtl" ? "ltr" : "rtl";
      this.$("#dir").textContent = "ทิศทาง: " + (this.style.direction === "rtl" ? "←" : "→");
      this.updatePreview();
    });
    this.$("#bold").addEventListener("click", () => {
      this.style.bold = !this.style.bold;
      this.syncToggles();
      this.updatePreview();
    });
    this.$("#glow").addEventListener("click", () => {
      this.style.glow = !this.style.glow;
      this.syncToggles();
      this.updatePreview();
    });
    this.$("#swatches").addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest("[data-c]") as HTMLElement | null;
      if (!b) return;
      this.style.color = b.dataset.c as string;
      this.$<HTMLInputElement>("#color").value = this.style.color;
      this.syncToggles();
      this.updatePreview();
    });
    this.$("#start").addEventListener("click", () => this.onStart(this.current()));
    this.$("#save").addEventListener("click", async () => {
      const name = window.prompt("ตั้งชื่อพรีเซ็ต:", this.message.slice(0, 24));
      if (name === null) return;
      await this.presetSvc.saveAs(name, this.current());
      await this.renderPresets();
    });
  }

  private syncToggles(): void {
    this.el.querySelectorAll<HTMLElement>("[data-fx]").forEach((b) => {
      b.classList.toggle("seg--on", b.dataset.fx === this.style.effect);
    });
    this.$("#bold").classList.toggle("chip--on", this.style.bold);
    this.$("#glow").classList.toggle("chip--on", this.style.glow);
    this.$("#dir").textContent = "ทิศทาง: " + (this.style.direction === "rtl" ? "←" : "→");
    this.el.querySelectorAll<HTMLElement>(".sw").forEach((b) => {
      b.classList.toggle("sw--on", b.dataset.c?.toLowerCase() === this.style.color.toLowerCase());
    });
  }

  private updatePreview(): void {
    const prev = this.$("#prev");
    const t = this.$("#prevText");
    prev.style.background = this.style.bgColor;
    t.textContent = this.message || " ";
    t.style.color = this.style.color;
    t.style.fontFamily = fontStack(this.style.fontFamily);
    t.style.fontWeight = this.style.bold ? "700" : "400";
    t.style.textShadow = this.style.glow
      ? `0 0 0.12em ${this.style.color}, 0 0 0.36em ${this.style.color}, 0 0 0.7em ${this.style.color}`
      : "none";
    prev.dataset.effect = this.style.effect;
    t.style.setProperty("--dur", (12 - this.style.speed) * 0.55 + "s");
    t.style.setProperty("--dir", this.style.direction === "rtl" ? "normal" : "reverse");
  }

  private async renderPresets(): Promise<void> {
    const wrap = this.$("#presets");
    const items = await this.presetSvc.list();
    if (items.length === 0) {
      wrap.innerHTML = `<div class="muted">ยังไม่มีพรีเซ็ต — กด 💾 เพื่อบันทึกอันแรก</div>`;
      return;
    }
    wrap.innerHTML = items
      .map(
        (p: Preset) => `
        <div class="preset" data-id="${p.id}">
          <span class="preset__name">${escapeHtml(p.name)}</span>
          <button type="button" data-act="load">โหลด</button>
          <button type="button" data-act="del">ลบ</button>
        </div>`
      )
      .join("");
    wrap.querySelectorAll<HTMLElement>(".preset").forEach((row) => {
      const id = row.dataset.id as string;
      row.querySelector('[data-act="load"]')!.addEventListener("click", async () => {
        const p = (await this.presetSvc.list()).find((x) => x.id === id);
        if (!p) return;
        this.message = p.sign.message;
        this.style = { ...p.sign.style };
        this.render();
      });
      row.querySelector('[data-act="del"]')!.addEventListener("click", async () => {
        await this.presetSvc.remove(id);
        await this.renderPresets();
      });
    });
  }

  private $<T extends HTMLElement = HTMLElement>(sel: string): T {
    return this.el.querySelector(sel) as T;
  }
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return s.replace(/[&<>"]/g, (c) => map[c]);
}
