// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  db = getFirestore(app);
}

// In the iOS app the web view cannot load Google's popup/redirect helpers, which makes
// getAuth() wait on them indefinitely. Native builds use IndexedDB persistence only, and
// social sign-in goes through the native plugin (see services/socialAuth.js).
let auth;
if (Capacitor.isNativePlatform()) {
  try { auth = initializeAuth(app, { persistence: indexedDBLocalPersistence }); }
  catch { auth = getAuth(app); }
} else {
  auth = getAuth(app);
}
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Smart Google Sign-In:
 * 1. Immediately triggers signInWithPopup on the synchronous click event.
 * 2. Automatically falls back to signInWithRedirect if the popup is blocked or closed on mobile.
 */
export async function signInWithGoogleSmart() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/operation-not-supported-in-this-environment' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('[Auth] Popup blocked by browser. Falling back to full-page redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export { app, db, auth, googleProvider, getRedirectResult };
export default app;
