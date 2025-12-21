
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyA_cwl5G0uhCZYmdV_pkqbCubuMCf5ozYo",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "anitracker-eccfa.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "anitracker-eccfa",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "anitracker-eccfa.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "791279578730",
  appId: env.VITE_FIREBASE_APP_ID || "1:791279578730:web:d0a7e50c8dd09691d76413",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-8SX2W6YXGS"
};

// Initialize Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();

// Use recommended transport settings for web environments
db.settings({
  experimentalAutoDetectLongPolling: true,
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

const storage = firebase.storage();

// Enable Firestore Offline Persistence with better multi-tab support
// This allows the app to work offline but prioritizes cloud sync when available
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("Persistence failed: Multiple tabs open.");
    } else if (err.code == 'unimplemented') {
        console.warn("Persistence not supported by browser.");
    }
  });

// Set Auth Persistence to LOCAL to survive browser restarts
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(() => {
    return auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  });

const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, db, googleProvider, storage };
export default app;
