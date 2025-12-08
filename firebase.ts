import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();

// Enable Firestore Offline Persistence
// This prevents data loss on refresh by storing reads/writes in IndexedDB
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("Persistence failed: Multiple tabs open");
    } else if (err.code == 'unimplemented') {
        console.warn("Persistence not supported by browser");
    }
  });

// Set Auth Persistence to Local (survives browser restart)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const googleProvider = new firebase.auth.GoogleAuthProvider();

// Force the account selection screen to appear, helping with multiple accounts
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, db, googleProvider };
export default app;