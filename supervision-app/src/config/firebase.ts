import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';

const env = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** True when the .env file has actually been filled in. */
export const isFirebaseConfigured = Boolean(env.apiKey && env.projectId && env.appId);

/**
 * `getAuth()` throws `auth/invalid-api-key` on an empty key, which would blank
 * the whole page before the "Firebase is not configured yet" banner could ever
 * render. Falling back to placeholder values keeps the UI alive during setup —
 * only the network calls fail, and the banner explains why.
 */
const firebaseConfig = isFirebaseConfigured
  ? env
  : {
      apiKey: 'not-configured',
      authDomain: 'not-configured.firebaseapp.com',
      projectId: 'not-configured',
      storageBucket: 'not-configured.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000',
      measurementId: '',
    };

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

/**
 * "Remember me" maps directly onto Firebase persistence:
 *  - local   -> the session survives a browser restart
 *  - session -> the user must sign in again on the next visit
 */
export const persistenceFor = (rememberMe: boolean) =>
  rememberMe ? browserLocalPersistence : browserSessionPersistence;
