import { describe, it, expect } from "vitest";
import { makePresetStore } from "../src/app/storeFactory";
import { LocalPresetStore } from "../src/infra/localPresetStore";
import { hasFirebaseConfig } from "../src/infra/firebaseConfig";

describe("storeFactory", () => {
  it("reports no Firebase config in the test env", () => {
    // No VITE_FIREBASE_* set under vitest → must be false (offline path).
    expect(hasFirebaseConfig()).toBe(false);
  });

  it("falls back to LocalPresetStore when Firebase is not configured", async () => {
    const store = await makePresetStore();
    expect(store).toBeInstanceOf(LocalPresetStore);
  });
});
