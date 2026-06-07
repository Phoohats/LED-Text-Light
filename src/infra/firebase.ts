// Lazy Firebase init with offline-persistent Firestore. Imported only when
// hasFirebaseConfig() is true (via dynamic import in the store factory).
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
    // persistentLocalCache → presets keep working offline and across reloads.
    db = initializeFirestore(app, { localCache: persistentLocalCache() });
  }
  return { app, auth: auth as Auth, db: db as Firestore };
}
