import { describe, it, expect } from "vitest";
import { makePresetStore } from "../src/app/storeFactory";
import { LocalPresetStore } from "../src/infra/localPresetStore";

describe("storeFactory", () => {
  // Inject `configured` so the test never depends on whether a .env happens to
  // be present in the test environment (vitest loads VITE_* from .env).
  it("uses LocalPresetStore when Firebase is not configured", async () => {
    const store = await makePresetStore(false);
    expect(store).toBeInstanceOf(LocalPresetStore);
  });

  it("returns a store exposing the PresetStore contract", async () => {
    const store = await makePresetStore(false);
    expect(typeof store.list).toBe("function");
    expect(typeof store.save).toBe("function");
    expect(typeof store.remove).toBe("function");
  });
});
