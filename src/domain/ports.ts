// Domain ports — the contracts infra must implement. Domain depends on nothing;
// adapters depend inward on these. (Hexagonal-lite, ADR-0006)
import type { Sign } from "./sign";

export interface Preset {
  id: string;
  name: string;
  sign: Sign;
  updatedAt: number;
}

/** Persist & retrieve presets. Phase 1 = localStorage; Phase 2 = Firestore. */
export interface PresetStore {
  list(): Promise<Preset[]>;
  save(preset: Preset): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Live broadcast channel for synced Shows. Reserved for Phase 3 (ADR-0004). */
export interface ShowChannel {
  host(sign: Sign): Promise<string>; // returns room code
  push(code: string, sign: Sign): Promise<void>;
  join(code: string, onSign: (sign: Sign, startedAt: number) => void): Promise<() => void>;
}

/** Anonymous identity. Reserved for Phase 2 (ADR-0005). */
export interface AuthGate {
  ensureUser(): Promise<string>; // returns uid
}
