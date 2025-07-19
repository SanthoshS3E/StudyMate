import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDq23CCzHR14Se4bR9X14th2BZkHm1Op2w",
  authDomain: "studymate-com.firebaseapp.com",
  projectId: "studymate-com",
  storageBucket: "studymate-com.firebasestorage.app",
  messagingSenderId: "802978972763",
  appId: "1:802978972763:web:21b7f3f2c79d6231e56b7e",
  measurementId: "G-H1ZG9F5LMB"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Force Firestore to always use long polling (no QUIC)
initializeFirestore(app, {
  experimentalForceLongPolling: true   // ✅ ONLY this, no autodetect
});

// ✅ Then get the Firestore instance (safe for existing code)
export const db = getFirestore(app);

// ✅ Other Firebase services stay the same
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
