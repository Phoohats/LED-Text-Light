// Picks the preset backend at runtime. Firestore when configured (with a bounded
// timeout so a flaky network can't block first paint), else local — always a
// usable store. Firebase code is dynamically imported so offline-only builds
// never download it.
import type { PresetStore } from "../domain/ports";
import { LocalPresetStore } from "../infra/localPresetStore";
import { hasFirebaseConfig } from "../infra/firebaseConfig";

const FIREBASE_INIT_TIMEOUT_MS = 5000;

export async function makePresetStore(): Promise<PresetStore> {
  if (hasFirebaseConfig()) {
    try {
      const { FirestorePresetStore } = await import("../infra/firestorePresetStore");
      return await Promise.race([
        FirestorePresetStore.create(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("firebase-init-timeout")), FIREBASE_INIT_TIMEOUT_MS)
        ),
      ]);
    } catch (e) {
      console.warn("[LTL] Firestore unavailable, falling back to local presets:", e);
    }
  }
  return new LocalPresetStore();
}
