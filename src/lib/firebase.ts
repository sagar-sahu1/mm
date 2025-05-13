
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, GoogleAuthProvider } from 'firebase/auth'; // Import GoogleAuthProvider
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analyticsInstance: Analytics | null = null;

const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
  'storageBucket',
];

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase config is missing required keys from environment variables: ${missingKeys.join(', ')}.`);
  // Create a placeholder for .env.local if it doesn't exist or is missing keys
  if (typeof window !== 'undefined') { // Only show alert in browser
    alert(`Warning: Firebase configuration is incomplete. Some features might not work. Please check your .env.local file for the following missing keys: ${missingKeys.join(', ')}`);
  }
}


if (getApps().length === 0) {
  try {
    if (requiredConfigKeys.every(key => !!firebaseConfig[key])) {
        app = initializeApp(firebaseConfig);
    } else {
        // Gracefully handle missing config for client-side rendering,
        // AuthProvider will show a loader and errors will be caught there.
        // This avoids crashing the app during build or initial load if env vars are not set.
        console.warn("Firebase configuration is incomplete. App initialization deferred.");
        // A pseudo-app or a specific error state could be set here if needed
        // For now, services relying on 'app' will fail gracefully or be caught by their initializers.
    }
  } catch (e) {
    console.error("Error initializing Firebase app:", e);
    // Potentially re-throw or set an error state for the app to handle
  }
} else {
  app = getApps()[0];
}

// Initialize services only if 'app' was successfully initialized
if (app!) {
  try {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Error initializing Firebase services (auth, db, storage):", e);
  }
} else {
  // Handle the case where app couldn't be initialized
  // auth, db, storage will remain undefined, and dependent features will need to handle this
  console.warn("Firebase app not initialized. Auth, Firestore, and Storage services will not be available.");
}


export function initializeClientAnalytics() {
  if (typeof window !== 'undefined' && !analyticsInstance && app!) { 
    isAnalyticsSupported().then(supported => {
      if (supported && firebaseConfig.measurementId) { 
        analyticsInstance = getAnalytics(app);
        console.log("Firebase Analytics initialized.");
      } else {
        console.log("Firebase Analytics is not supported in this environment or measurementId is missing.");
      }
    }).catch(e => {
      console.error("Error initializing Firebase Analytics:", e);
    });
  }
}

const getDb = (): Firestore => {
  if (!db) {
    if (!app!) {
        if (getApps().length === 0) {
           if (requiredConfigKeys.every(key => !!firebaseConfig[key])) {
            app = initializeApp(firebaseConfig);
           } else {
             throw new Error("Firebase configuration is incomplete. Cannot initialize app before getting Firestore instance.");
           }
        } else {
            app = getApps()[0];
        }
    }
    db = getFirestore(app);
  }
  return db;
}

const getAppStorage = (): FirebaseStorage => {
  if (!storage) {
     if (!app!) {
        if (getApps().length === 0) {
           if (requiredConfigKeys.every(key => !!firebaseConfig[key])) {
            app = initializeApp(firebaseConfig);
           } else {
             throw new Error("Firebase configuration is incomplete. Cannot initialize app before getting Storage instance.");
           }
        } else {
            app = getApps()[0];
        }
    }
    storage = getStorage(app);
  }
  return storage;
}


export { app, auth, db, getDb, storage, getAppStorage, GoogleAuthProvider }; 
export { analyticsInstance as analytics };
