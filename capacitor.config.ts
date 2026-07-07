import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alunoconecta.app',
  appName: 'Portal do Aluno',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      providers: ['google.com']
    }
  }
};

export default config;
