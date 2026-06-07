// ShowChannel adapter — Firestore broadcast (ADR-0004). One doc per show holds
// the active Sign + a server startedAt; viewers mirror it and animate from a
// clock-synced elapsed time. Dynamically imported only when configured.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import { AnonAuth } from "./anonAuth";
import { createSign, type Sign, type SignStyle } from "../domain/sign";
import { generateRoomCode } from "../domain/roomCode";
import type { ShowChannel, ShowSession, ViewerSession } from "../domain/ports";

interface ActiveSign {
  message: string;
  style: SignStyle;
  startedAt: Timestamp | null;
}

function activeFrom(sign: Sign) {
  return { message: sign.message, style: sign.style, startedAt: serverTimestamp() };
}

export class FirestoreShowChannel implements ShowChannel {
  async host(initial: Sign): Promise<ShowSession> {
    const { db } = getFirebase();
    const uid = await new AnonAuth().ensureUser();

    // pick a free code (4 chars ≈ 1M combos; retry on the rare collision)
    let code = generateRoomCode();
    for (let i = 0; i < 6; i++) {
      const existing = await getDoc(doc(db, "shows", code));
      if (!existing.exists()) break;
      code = generateRoomCode();
    }

    const showRef = doc(db, "shows", code);
    await setDoc(showRef, { ownerUid: uid, active: activeFrom(initial), createdAt: serverTimestamp() });

    return {
      code,
      async push(sign: Sign) {
        await updateDoc(showRef, { active: activeFrom(sign) });
      },
      onViewers(cb: (count: number) => void) {
        return onSnapshot(collection(db, "shows", code, "viewers"), (snap) => cb(snap.size));
      },
      async close() {
        await deleteDoc(showRef);
      },
    };
  }

  async join(code: string): Promise<ViewerSession | null> {
    const { db } = getFirebase();
    const uid = await new AnonAuth().ensureUser();
    const showRef = doc(db, "shows", code);

    const snap = await getDoc(showRef);
    if (!snap.exists()) return null;

    // Presence + clock probe. NTP-style: stamp the server time, bracket the
    // write with local timestamps, and estimate the server instant at the
    // round-trip midpoint. Take the sample with the lowest RTT over a few tries
    // (least queuing = most accurate) so tiled wall screens align tightly.
    const viewerRef = doc(db, "shows", code, "viewers", uid);
    let clockOffsetMs = 0;
    let bestRtt = Infinity;
    for (let k = 0; k < 3; k++) {
      try {
        const t0 = Date.now();
        await setDoc(viewerRef, { joinedAt: serverTimestamp(), seenAt: serverTimestamp() });
        const t1 = Date.now();
        const back = await getDoc(viewerRef);
        const serverMs = (back.get("seenAt") as Timestamp | undefined)?.toMillis();
        const rtt = t1 - t0;
        if (serverMs && rtt < bestRtt) {
          bestRtt = rtt;
          clockOffsetMs = serverMs - (t0 + t1) / 2; // server instant ≈ write midpoint
        }
      } catch {
        break; // offline / denied — keep best so far (or 0)
      }
    }

    return {
      code,
      clockOffsetMs,
      onSign(cb: (sign: Sign, startedAtMs: number) => void) {
        return onSnapshot(showRef, (s) => {
          const active = s.get("active") as ActiveSign | undefined;
          if (!active) return;
          const startedAtMs = active.startedAt?.toMillis() ?? Date.now() + clockOffsetMs;
          cb(createSign(active.message, active.style), startedAtMs);
        });
      },
      async leave() {
        await deleteDoc(viewerRef).catch(() => {});
      },
    };
  }
}
