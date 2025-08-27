// FIX: Switched to Firebase compat libraries to resolve module export errors, likely due to an older Firebase version being installed.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// The component App.tsx already prevents the application from rendering if these keys
// are not defined, so we can assume they exist here.
// FIX: Removed the 'measurementId' property as its corresponding environment variable was not defined in the project's TypeScript types. This is an optional property for Firebase Analytics and not required for the app to function.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
