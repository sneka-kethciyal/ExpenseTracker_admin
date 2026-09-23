import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if configuration is present and not a placeholder
const isPlaceholder = (val) =>
  !val ||
  val === 'your_api_key_here' ||
  val === 'your_project_id' ||
  val.startsWith('your_');

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  !isPlaceholder(firebaseConfig.apiKey) &&
  !isPlaceholder(firebaseConfig.projectId)
);

if (!isFirebaseConfigured) {
  console.warn('Firebase configuration is missing or incomplete. Please check your .env file.');
}

// Initialize primary Firebase App safely (avoids duplicate app initialization)
const app = isFirebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

// Primary Firebase services
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

/**
 * Returns a secondary Auth instance using a named Firebase app.
 * Used by administrators to create new users without logging out of the active session.
 */
export function getSecondaryAuth() {
  if (!isFirebaseConfigured || !firebaseConfig.apiKey) {
    throw new Error('Cannot initialize secondary Auth: Firebase configuration is missing. Check your .env file.');
  }

  const SECONDARY_APP_NAME = 'SecondaryApp';
  const existingApps = getApps();

  let secondaryApp = existingApps.find(
    (firebaseApp) => firebaseApp.name === SECONDARY_APP_NAME
  );

  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  }

  return getAuth(secondaryApp);
}

export default app;