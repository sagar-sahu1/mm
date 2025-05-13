
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics, type Analytics } from "firebase/analytics"; // Added Analytics import
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Uncomment if you need Firestore
// import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Uncomment if you need Storage

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAj9KUXlLqgU2448q-Dtx8X2-laaAclLas",
  authDomain: "newv2-68c50.firebaseapp.com",
  projectId: "newv2-68c50",
  storageBucket: "newv2-68c50.appspot.com", // Corrected storage bucket format
  messagingSenderId: "329562095423",
  appId: "1:329562095423:web:cc50f513cc8c1080f0dd8a",
  measurementId: "G-Q8VYCR1YD7"
};


let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics; // Added Analytics
// let db: Firestore; // Uncomment if you need Firestore
// let storage: FirebaseStorage; // Uncomment if you need Storage

// Ensure all required Firebase config keys are present before initializing
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId', // App ID is generally required
  // Add other keys if they are strictly required for your app's core functionality
  // 'storageBucket', // Often optional unless you use Storage immediately
  // 'messagingSenderId', // Optional unless you use FCM immediately
];

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase config is missing required keys: ${missingKeys.join(', ')}.`);
  console.error('Please ensure all Firebase configuration values are set correctly.');
  // Potentially throw an error or handle this state appropriately for your application
  // For now, we'll let Firebase SDK throw its own error if it can't initialize
}


if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Error initializing Firebase app:", e);
    // Handle initialization error, e.g., by setting app to a fallback or re-throwing
    // For now, we let the error propagate, which might break the app if Firebase is crucial.
    throw e;
  }
} else {
  app = getApps()[0];
}

try {
  auth = getAuth(app);
  analytics = getAnalytics(app); // Initialize Analytics
} catch (e) {
  console.error("Error initializing Firebase services (Auth/Analytics):", e);
  // Handle service initialization error
  throw e;
}

// db = getFirestore(app); // Uncomment if you need Firestore
// storage = getStorage(app); // Uncomment if you need Storage

export { app, auth, analytics /*, db, storage */ }; // Export db and storage if you uncomment them
