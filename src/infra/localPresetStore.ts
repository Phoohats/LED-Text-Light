// Adapter — implements PresetStore on top of localStorage. Phase 1 (offline).
// Phase 2 swaps in a FirestorePresetStore behind the same port. (ADR-0006)
import type { Preset, PresetStore } from "../domain/ports";

const KEY = "ltl.presets.v1";

export class LocalPresetStore implements PresetStore {
  async list(): Promise<Preset[]> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Preset[]) : [];
    } catch {
      return [];
    }
  }

  async save(preset: Preset): Promise<void> {
    const all = await this.list();
    const idx = all.findIndex((p) => p.id === preset.id);
    if (idx >= 0) all[idx] = preset;
    else all.push(preset);
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  async remove(id: string): Promise<void> {
    const all = (await this.list()).filter((p) => p.id !== id);
    localStorage.setItem(KEY, JSON.stringify(all));
  }
}
