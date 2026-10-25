// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 1. Diagnostic check to catch missing .env variables immediately
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || value.includes('YourActualApiKeyHere'))
  .map(([key]) => key);

export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `[ProximaStruc Firebase Warning] Missing or placeholder .env keys detected: ${missingKeys.join(
      ', '
    )}. Check your .env file and restart 'npm run dev'.`
  );
}

// 2. Singleton App Initialization (Prevents Vite HMR duplicate-app crashes)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 3. Initialize Firestore with Auto-Long-Polling & Multi-Tab Offline Persistence
// Fixes "WebChannelConnection RPC 'Listen' stream transport errored" on site networks
let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // Fallback if Firestore was already initialized during Vite hot-reload
  db = getFirestore(app);
}

// 4. Initialize Auth & Storage
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

export { app, db, auth, googleProvider, storage };
export default app;
