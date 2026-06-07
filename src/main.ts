import "./style.css";
import { EditorView } from "./ui/EditorView";
import { DisplayView } from "./ui/DisplayView";
import { PresetService } from "./app/presetService";
import { makePresetStore } from "./app/storeFactory";
import { initIosHints } from "./ui/iosHints";

async function main(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) throw new Error("#app not found");

  initIosHints();

  // Firestore when configured (Phase 2), else local — both behind PresetStore.
  const presets = new PresetService(await makePresetStore());

  const display = new DisplayView(() => {
    document.body.classList.remove("showing");
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  });
  document.body.appendChild(display.el);

  const editor = new EditorView(presets, async (sign) => {
    document.body.classList.add("showing");
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* fullscreen denied — show inline */
    }
    try {
      await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.("landscape");
    } catch {
      /* unsupported on iOS Safari — handled by initIosHints() */
    }
    display.show(sign);
  });
  app.appendChild(editor.el);
  editor.init();
}

void main();
