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

// Live broadcast channel for synced Shows (Phase 3, ADR-0004).

/** Controller side: owns the Show and pushes the active Sign. */
export interface ShowSession {
  readonly code: string;
  push(sign: Sign): Promise<void>;
  onViewers(cb: (count: number) => void): () => void; // returns unsubscribe
  close(): Promise<void>;
}

/** Viewer side: mirrors the Controller's active Sign, clock-synced. */
export interface ViewerSession {
  readonly code: string;
  readonly clockOffsetMs: number; // serverTime - localTime, for synced animation
  onSign(cb: (sign: Sign, startedAtMs: number) => void): () => void;
  leave(): Promise<void>;
}

export interface ShowChannel {
  host(initial: Sign): Promise<ShowSession>;
  join(code: string): Promise<ViewerSession | null>; // null when the code doesn't exist
}

/** Anonymous identity. Reserved for Phase 2 (ADR-0005). */
export interface AuthGate {
  ensureUser(): Promise<string>; // returns uid
}
