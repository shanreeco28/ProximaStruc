import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDn6tKFPwszxiXOcayglRjl4yTCr7Y2BJo",
  authDomain: "tnd4-castrack.firebaseapp.com",
  projectId: "tnd4-castrack",
  storageBucket: "tnd4-castrack.firebasestorage.app",
  messagingSenderId: "579746948632",
  appId: "1:579746948632:web:8f806ca4c50543a2dbc56d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
