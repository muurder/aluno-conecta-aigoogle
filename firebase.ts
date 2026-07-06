// FIX: Switched to Firebase compat libraries to resolve module export errors, likely due to an older Firebase version being installed.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasKeys = !!(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);

function createFallbackAuth() {
  return {
    currentUser: null,
    onAuthStateChanged: (cb: (user: any) => void) => {
      cb(null);
      return () => {};
    },
    signInWithEmailAndPassword: async () => { throw new Error('Firebase indisponível (fallback)'); },
    signOut: async () => {},
    createUserWithEmailAndPassword: async () => { throw new Error('Firebase indisponível (fallback)'); },
  } as any;
}

function createFallbackFirestore() {
  return {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => null }),
        update: async () => {},
        set: async () => {},
      }),
      get: async () => ({ docs: [] }),
      add: async () => ({}),
    }),
    enablePersistence: async () => {},
  } as any;
}

function createFallbackStorage() {
  return {
    ref: () => ({
      put: async () => ({}),
      getDownloadURL: async () => '',
    }),
  } as any;
}

function initFirebaseSafely(): { auth: any; db: any; storage: any; failed: boolean } {
  if (!hasKeys) {
    return {
      auth: createFallbackAuth(),
      db: createFallbackFirestore(),
      storage: createFallbackStorage(),
      failed: true,
    };
  }

  try {
    const app = firebase.initializeApp(firebaseConfig);

    if (/iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      try {
        app.firestore().disableNetwork();
      } catch {}
    }

    return {
      auth: app.auth(),
      db: app.firestore(),
      storage: app.storage(),
      failed: false,
    };
  } catch (err) {
    console.error('[firebase] init failed, using fallback:', err);
    return {
      auth: createFallbackAuth(),
      db: createFallbackFirestore(),
      storage: createFallbackStorage(),
      failed: true,
    };
  }
}

const initialized = initFirebaseSafely();

export const auth = initialized.auth;
export const db = initialized.db;
export const storage = initialized.storage;
export { firebase };
export const firebaseInitFailed = initialized.failed;
export const firebaseApp = firebase.apps.length > 0 ? firebase.apps[0] : null;

