
interface ImportMetaEnv {
  // Variáveis de ambiente do Vite para o Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  // Variável de ambiente para a API do Gemini
  readonly VITE_GENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// FIX: Replaced `declare var process` with namespace augmentation to avoid redeclaring a global variable.
// This correctly adds types for `process.env` without conflicting with existing Node.js types.
// Adicionado para suportar `process.env` para a chave da API do Gemini
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    API_KEY: string;
  }
}