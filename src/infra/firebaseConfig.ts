// Firebase web config from Vite env (.env / hosting build env). These values are
// NOT secret (web config is public), but kept in env so the repo stays portable.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True only when enough config is present to init Firebase. Otherwise the app
 *  runs Phase-1 offline (LocalPresetStore) with no Firebase code downloaded. */
export function hasFirebaseConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}
