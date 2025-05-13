
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Import Storage
// Import Analytics types and functions but defer initialization
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let storage: FirebaseStorage; // Declare storage
let analyticsInstance: Analytics | null = null; // Store analytics instance

// Ensure all required Firebase config keys are present before initializing
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
  'storageBucket', // Add storageBucket as required for Storage initialization
];

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase config is missing required keys from environment variables: ${missingKeys.join(', ')}.`);
  console.error('Please ensure all NEXT_PUBLIC_FIREBASE_ prefixed environment variables are set correctly in your .env or .env.local file.');
  // Potentially throw an error or handle this state appropriately for your application
}


if (getApps().length === 0) {
  try {
    if (requiredConfigKeys.every(key => !!firebaseConfig[key])) {
        app = initializeApp(firebaseConfig);
    } else {
        throw new Error("Firebase configuration is incomplete. Cannot initialize app.");
    }
  } catch (e) {
    console.error("Error initializing Firebase app:", e);
    throw e; // Re-throw if app initialization fails
  }
} else {
  app = getApps()[0];
}

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app); // Initialize storage
} catch (e) {
  console.error("Error initializing Firebase services:", e);
  // Depending on app's requirements, might re-throw or handle
}

// Function to initialize analytics on the client side
export function initializeClientAnalytics() {
  if (typeof window !== 'undefined' && !analyticsInstance) { // Check if running on client and not already initialized
    isAnalyticsSupported().then(supported => {
      if (supported && firebaseConfig.measurementId) { // ensure measurementId is present
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
    if (getApps().length === 0) {
       if (requiredConfigKeys.every(key => !!firebaseConfig[key])) {
        app = initializeApp(firebaseConfig);
       } else {
         throw new Error("Firebase configuration is incomplete. Cannot initialize app before getting Firestore instance.");
       }
    } else {
        app = getApps()[0];
    }
    db = getFirestore(app);
  }
  return db;
}

const getAppStorage = (): FirebaseStorage => {
  if (!storage) {
    if (getApps().length === 0) {
       if (requiredConfigKeys.every(key => !!firebaseConfig[key])) {
        app = initializeApp(firebaseConfig);
       } else {
         throw new Error("Firebase configuration is incomplete. Cannot initialize app before getting Storage instance.");
       }
    } else {
        app = getApps()[0];
    }
    storage = getStorage(app);
  }
  return storage;
}


// Export auth and app as before
export { app, auth, db, getDb, storage, getAppStorage }; // Export storage and its getter
// Export analytics instance (will be null on server, initialized on client after calling initializeClientAnalytics)
export { analyticsInstance as analytics };
