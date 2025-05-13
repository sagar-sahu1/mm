
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Uncomment if you need Firestore
// import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Uncomment if you need Storage

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let auth: Auth;
// let db: Firestore; // Uncomment if you need Firestore
// let storage: FirebaseStorage; // Uncomment if you need Storage

// Ensure all required Firebase config keys are present before initializing
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  // Add other keys if they are strictly required for your app's core functionality
  // 'storageBucket', // Often optional unless you use Storage immediately
  // 'messagingSenderId', // Optional unless you use FCM immediately
  // 'appId', // Generally required
];

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase config is missing required keys: ${missingKeys.join(', ')}.`);
  console.error('Please ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set correctly in your .env file.');
  // Potentially throw an error or handle this state appropriately for your application
  // For now, we'll let Firebase SDK throw its own error if it can't initialize
}


if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// db = getFirestore(app); // Uncomment if you need Firestore
// storage = getStorage(app); // Uncomment if you need Storage

export { app, auth /*, db, storage */ }; // Export db and storage if you uncomment them
