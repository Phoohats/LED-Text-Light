// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { EditorView } from "../src/ui/EditorView";
import { DisplayView } from "../src/ui/DisplayView";
import { PresetService } from "../src/app/presetService";
import { LocalPresetStore } from "../src/infra/localPresetStore";
import { FONTS } from "../src/config/fonts";
import { createSign } from "../src/domain/sign";
import type { Sign } from "../src/domain/sign";

beforeEach(() => localStorage.clear());

describe("EditorView", () => {
  it("renders all 10 fonts + effect + start controls", () => {
    const ed = new EditorView(new PresetService(new LocalPresetStore()), () => {});
    document.body.appendChild(ed.el);
    ed.init();
    expect(ed.el.querySelectorAll("#font option").length).toBe(FONTS.length);
    expect(ed.el.querySelectorAll("[data-fx]").length).toBe(4);
    expect(ed.el.querySelector("#start")).toBeTruthy();
  });

  it("emits a Sign carrying the typed Thai + emoji message on start", () => {
    let started: Sign | null = null;
    const ed = new EditorView(new PresetService(new LocalPresetStore()), (s) => (started = s));
    document.body.appendChild(ed.el);
    ed.init();
    const msg = ed.el.querySelector("#msg") as HTMLTextAreaElement;
    msg.value = "ลุยโลด 🔥";
    msg.dispatchEvent(new Event("input"));
    (ed.el.querySelector("#start") as HTMLButtonElement).click();
    expect(started).not.toBeNull();
    expect(started!.message).toBe("ลุยโลด 🔥");
  });

  it("persists a preset through the service", async () => {
    const svc = new PresetService(new LocalPresetStore());
    await svc.saveAs("เชียร์", createSign("สู้ๆ 💪"));
    const list = await svc.list();
    expect(list.length).toBe(1);
    expect(list[0].sign.message).toBe("สู้ๆ 💪");
  });
});

describe("DisplayView", () => {
  it("applies message, color and weight to the fullscreen sign", () => {
    const dv = new DisplayView(() => {});
    document.body.appendChild(dv.el);
    dv.show(createSign("HELLO 🎉", { effect: "static", bold: true }));
    const text = dv.el.querySelector(".display__text") as HTMLElement;
    expect(text.textContent).toBe("HELLO 🎉");
    expect(text.style.fontWeight).toBe("700");
    expect(text.style.textShadow).not.toBe("none"); // glow applied by default
    dv.hide();
  });
});
