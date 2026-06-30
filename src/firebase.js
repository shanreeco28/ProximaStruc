import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2cuD0te8PucdZh8kZM984Z_2KkWsDmG8",
  authDomain: "project-management-site-b04fa.firebaseapp.com",
  projectId: "project-management-site-b04fa",
  storageBucket: "project-management-site-b04fa.firebasestorage.app",
  messagingSenderId: "814353717822",
  appId: "1:814353717822:web:3e22e1f23ba0b233ab0f6f",
  measurementId: "G-2RK8DYH1W3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
