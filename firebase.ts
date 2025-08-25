// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// ATENÇÃO: Substitua este objeto de exemplo pelo seu próprio `firebaseConfig`
// que você copiou do console do Firebase. NUNCA compartilhe suas chaves publicamente.
const firebaseConfig = {
  apiKey: "COLOQUE_SUA_NOVA_API_KEY_AQUI",
  authDomain: "COLOQUE_SEU_AUTH_DOMAIN_AQUI",
  projectId: "COLOQUE_SEU_PROJECT_ID_AQUI",
  storageBucket: "COLOQUE_SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "COLOQUE_SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "COLOQUE_SEU_APP_ID_AQUI",
  measurementId: "COLOQUE_SEU_MEASUREMENT_ID_AQUI" // opcional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
