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

  const editor = new EditorView(presets, (sign) => {
    document.body.classList.add("showing");
    // Show FIRST (synchronously) so the wake-lock enable runs inside the user
    // gesture — iOS rejects it otherwise and the screen sleeps. Fullscreen and
    // orientation are best-effort and must not be awaited before this.
    display.show(sign);
    void document.documentElement.requestFullscreen?.().catch(() => {
      /* fullscreen unsupported on iOS Safari — inline overlay still covers the viewport */
    });
    void (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })
      ?.lock?.("landscape")
      .catch(() => {
        /* unsupported on iOS Safari — handled by initIosHints() */
      });
  });
  app.appendChild(editor.el);
  editor.init();
}

void main();
