// AuthGate adapter — Firebase Anonymous Auth (ADR-0005). Zero-friction identity.
import { signInAnonymously } from "firebase/auth";
import { getFirebase } from "./firebase";
import type { AuthGate } from "../domain/ports";

export class AnonAuth implements AuthGate {
  async ensureUser(): Promise<string> {
    const { auth } = getFirebase();
    if (auth.currentUser) return auth.currentUser.uid;
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  }
}
