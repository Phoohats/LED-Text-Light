import "./style.css";
import { EditorView } from "./ui/EditorView";
import { DisplayView } from "./ui/DisplayView";
import { LocalPresetStore } from "./infra/localPresetStore";
import { PresetService } from "./app/presetService";

const app = document.getElementById("app");
if (!app) throw new Error("#app not found");

const presets = new PresetService(new LocalPresetStore());

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
    // best-effort; unsupported on iOS Safari
    await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.("landscape");
  } catch {
    /* ignore */
  }
  display.show(sign);
});
app.appendChild(editor.el);
editor.init();
