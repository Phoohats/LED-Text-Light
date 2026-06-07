import "./style.css";
import { EditorView } from "./ui/EditorView";
import { DisplayView, type WallInfo } from "./ui/DisplayView";
import { HostView } from "./ui/HostView";
import { PresetService } from "./app/presetService";
import { makePresetStore, makeShowChannel } from "./app/storeFactory";
import { initIosHints } from "./ui/iosHints";
import { hasFirebaseConfig } from "./infra/firebaseConfig";
import { createSign, type Sign } from "./domain/sign";
import { normalizeRoomCode } from "./domain/roomCode";
import type { ShowSession, ViewerSession } from "./domain/ports";

async function main(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) throw new Error("#app not found");

  initIosHints();

  const presets = new PresetService(await makePresetStore());

  let editor: EditorView;
  let hostSession: ShowSession | null = null;
  let viewerSession: ViewerSession | null = null;

  const display = new DisplayView(() => {
    document.body.classList.remove("showing");
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    if (viewerSession) {
      void viewerSession.leave();
      viewerSession = null;
    }
  });
  document.body.appendChild(display.el);

  // Show a Sign fullscreen on THIS device (must run synchronously from the tap
  // so the wake-lock enable stays inside the user gesture — see wakeLock.ts).
  const startLocal = (sign: Sign): void => {
    document.body.classList.add("showing");
    display.show(sign);
    void document.documentElement.requestFullscreen?.().catch(() => {});
    void (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })
      ?.lock?.("landscape")
      .catch(() => {});
  };

  const hostView = new HostView({
    onPush: () => void hostSession?.push(editor.getSign()),
    onShowLocal: () => startLocal(editor.getSign()),
    onClose: () => {
      void hostSession?.close();
      hostSession = null;
      hostView.hide();
    },
  });
  document.body.appendChild(hostView.el);

  // Tap gate — the wake-lock enable must run inside a user gesture (iOS). Joining
  // via a scanned QR / deep link has no prior tap, and even the manual join loses
  // the gesture across the prompt + awaits, so we always gate viewer playback
  // behind one explicit tap.
  const gate = document.createElement("div");
  gate.className = "tapgate";
  gate.innerHTML = `<button type="button" class="btn btn--primary tapgate__btn">▶ แตะเพื่อเริ่มโชว์</button><div class="tapgate__sub"></div>`;
  document.body.appendChild(gate);
  const gateBtn = gate.querySelector(".tapgate__btn") as HTMLButtonElement;
  let gateAction: (() => void) | null = null;
  gateBtn.addEventListener("click", () => {
    gate.classList.remove("tapgate--show");
    gateAction?.();
  });
  const showTapGate = (sub: string, action: () => void): void => {
    (gate.querySelector(".tapgate__sub") as HTMLElement).textContent = sub;
    gateAction = action;
    gate.classList.add("tapgate--show");
  };

  async function joinAsViewer(code: string, wall: WallInfo | null = null): Promise<void> {
    if (!hasFirebaseConfig()) {
      window.alert("โหมดเข้าร่วมต้องตั้งค่า Firebase ก่อน");
      return;
    }
    const ch = await makeShowChannel();
    if (!ch) return;
    let session: ViewerSession | null;
    try {
      session = await ch.join(code);
    } catch (e) {
      window.alert("เข้าร่วมไม่สำเร็จ: " + (e as Error).message);
      return;
    }
    if (!session) {
      window.alert("ไม่พบโชว์รหัส " + code);
      return;
    }
    const s = session;
    viewerSession = s;

    let pending: { sign: Sign; startedAtMs: number } | null = null;
    let started = false;
    s.onSign((sign, startedAtMs) => {
      pending = { sign, startedAtMs };
      if (started) display.setSign(sign, { startedAtMs, clockOffsetMs: s.clockOffsetMs });
    });

    showTapGate(wall ? `จอ ${wall.index}/${wall.count} • รหัส ${code}` : `รหัส ${code}`, () => {
      started = true;
      document.body.classList.add("showing");
      display.setWall(wall);
      if (pending) {
        display.show(pending.sign, { startedAtMs: pending.startedAtMs, clockOffsetMs: s.clockOffsetMs });
      } else {
        display.show(createSign("รอป้ายจากคนคุม…", { effect: "static", color: "#00e5ff" }));
      }
      void document.documentElement.requestFullscreen?.().catch(() => {});
      void (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })
        ?.lock?.("landscape")
        .catch(() => {});
    });
  }

  editor = new EditorView(
    presets,
    (sign) => startLocal(sign),
    async () => {
      // onHost
      if (!hasFirebaseConfig()) {
        window.alert("โหมดออกอากาศต้องตั้งค่า Firebase ก่อน");
        return;
      }
      try {
        const ch = await makeShowChannel();
        if (!ch) return;
        hostSession = await ch.host(editor.getSign());
        hostView.show(hostSession.code, `${location.origin}/?show=${hostSession.code}`);
        hostSession.onViewers((n) => hostView.setViewers(n));
      } catch (e) {
        window.alert("เริ่มออกอากาศไม่สำเร็จ: " + (e as Error).message);
      }
    },
    () => {
      // onJoin (plain mirror)
      const code = normalizeRoomCode(window.prompt("กรอกรหัสห้อง:", "") ?? "");
      if (code) void joinAsViewer(code);
    },
    () => {
      // onWall (video-wall tile — this device picks its own slot)
      const code = normalizeRoomCode(window.prompt("รหัสห้อง:", "") ?? "");
      if (!code) return;
      const index = parseInt(window.prompt("เครื่องนี้คือจอที่เท่าไหร่? (1, 2, 3 …)", "1") ?? "", 10);
      const count = parseInt(window.prompt("ทั้งหมดกี่จอ?", "3") ?? "", 10);
      if (!Number.isInteger(index) || !Number.isInteger(count) || index < 1 || count < 1 || index > count) {
        window.alert("เลขจอไม่ถูกต้อง (จอที่ X ต้องไม่เกินจำนวนทั้งหมด)");
        return;
      }
      void joinAsViewer(code, { index, count, bezelPx: 0 });
    }
  );
  app.appendChild(editor.el);
  editor.init();

  // Deep link: /?show=CODE → auto-join as a Viewer (from a scanned QR / shared
  // link). Optional &i=2&n=3 joins directly as video-wall tile 2 of 3.
  const params = new URLSearchParams(location.search);
  const linkCode = normalizeRoomCode(params.get("show") ?? "");
  if (linkCode) {
    const i = parseInt(params.get("i") ?? "", 10);
    const n = parseInt(params.get("n") ?? "", 10);
    const wall: WallInfo | null =
      Number.isInteger(i) && Number.isInteger(n) && i >= 1 && n >= 1 && i <= n
        ? { index: i, count: n, bezelPx: 0 }
        : null;
    void joinAsViewer(linkCode, wall);
  }
}

void main();
