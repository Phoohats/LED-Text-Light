// PresetStore adapter — Firestore at users/{uid}/presets (ADR-0006). Same port
// as LocalPresetStore, so the app/UI layer is unchanged from Phase 1.
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { AnonAuth } from "./anonAuth";
import type { Preset, PresetStore } from "../domain/ports";

export class FirestorePresetStore implements PresetStore {
  private constructor(private readonly uid: string) {}

  /** Ensures an anonymous user first, then binds the store to that uid. */
  static async create(): Promise<FirestorePresetStore> {
    const uid = await new AnonAuth().ensureUser();
    return new FirestorePresetStore(uid);
  }

  private colPath() {
    const { db } = getFirebase();
    return collection(db, "users", this.uid, "presets");
  }

  async list(): Promise<Preset[]> {
    const snap = await getDocs(query(this.colPath(), orderBy("updatedAt", "desc")));
    return snap.docs.map((d) => d.data() as Preset);
  }

  async save(preset: Preset): Promise<void> {
    const { db } = getFirebase();
    await setDoc(doc(db, "users", this.uid, "presets", preset.id), preset);
  }

  async remove(id: string): Promise<void> {
    const { db } = getFirebase();
    await deleteDoc(doc(db, "users", this.uid, "presets", id));
  }
}
