// Application use-case — orchestrates the PresetStore port. Knows nothing about
// where presets live (localStorage / Firestore), only the contract. (ADR-0006)
import type { Preset, PresetStore } from "../domain/ports";
import type { Sign } from "../domain/sign";

export class PresetService {
  constructor(private store: PresetStore) {}

  list(): Promise<Preset[]> {
    return this.store.list();
  }

  async saveAs(name: string, sign: Sign): Promise<Preset> {
    const preset: Preset = {
      id: newId(),
      name: name.trim() || "ป้ายไฟ",
      sign,
      updatedAt: Date.now(),
    };
    await this.store.save(preset);
    return preset;
  }

  remove(id: string): Promise<void> {
    return this.store.remove(id);
  }
}

function newId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 10);
}
