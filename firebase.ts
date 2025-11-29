import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// CONFIGURATION
// Netlify will inject these values via import.meta.env during build.
// ------------------------------------------------------------------

// Cast import.meta to any to avoid TypeScript error "Property 'env' does not exist on type 'ImportMeta'"
// We add "|| {}" to handle environments where import.meta.env is undefined (like raw browser modules)
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyA_cwl5G0uhCZYmdV_pkqbCubuMCf5ozYo",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "anitracker-eccfa.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "anitracker-eccfa",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "anitracker-eccfa.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "791279578730",
  appId: env.VITE_FIREBASE_APP_ID || "1:791279578730:web:d0a7e50c8dd09691d76413",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-8SX2W6YXGS"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
export default app;