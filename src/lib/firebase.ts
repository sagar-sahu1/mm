
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"; // Added Analytics import

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
let analytics: Analytics | null = null; // Initialize as null
// let db: Firestore; // Uncomment if you need Firestore
// let storage: FirebaseStorage; // Uncomment if you need Storage

// Ensure all required Firebase config keys are present before initializing
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase config is missing required keys from environment variables: ${missingKeys.join(', ')}.`);
  console.error('Please ensure all NEXT_PUBLIC_FIREBASE_ prefixed environment variables are set correctly in your .env.local file.');
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
    throw e;
  }
} else {
  app = getApps()[0];
}

try {
  auth = getAuth(app);
  // Initialize Analytics only on the client side and if supported
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      } else {
        console.log("Firebase Analytics is not supported in this environment.");
      }
    }).catch(e => {
        console.error("Error checking Firebase Analytics support:", e);
    });
  }
} catch (e) {
  console.error("Error initializing Firebase services (Auth/Analytics):", e);
  // We don't re-throw here as auth might be initialized successfully
  // and analytics is optional.
}

// db = getFirestore(app); // Uncomment if you need Firestore
// storage = getStorage(app); // Uncomment if you need Storage

export { app, auth, analytics /*, db, storage */ }; // Export db and storage if you uncomment them
