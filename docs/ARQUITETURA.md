# Arquitetura do Sistema - Aluno Conecta

## Visão Geral

Aluno Conecta é uma aplicação web/mobile híbrida construída com:
- **Frontend:** React 19 + TypeScript + Vite
- **Mobile:** Capacitor (Android/iOS)
- **Backend:** Firebase (Auth, Firestore, Storage)
- **IA:** Google Generative AI (Gemini)
- **Estilização:** Tailwind CSS via CDN
- **Roteamento:** React Router DOM v6 (HashRouter para mobile)

---

## Arquitetura de Camadas

```
┌─────────────────────────────────────────┐
│         Apresentação (Pages)            │
│  pages/Home, pages/Profile, pages/...   │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│      Componentes Reutilizáveis           │
│  components/StudentIdCard, BottomNav... │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│           Layouts                        │
│  layouts/MainLayout.tsx                 │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│      Contextos (Estado Global)           │
│  AuthContext, ThemeContext, Notifications│
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│        Serviços Externos                 │
│  firebase.ts, services/genai.ts         │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│      Configuração e Constantes           │
│  types.ts, constants.tsx, vite.config.ts │
└─────────────────────────────────────────┘
```

---

## Fluxo de Dados

### 1. Autenticação
```
Login.tsx → AuthContext.login() → Firebase Auth
                                    ↓
                         Firestore profiles/{uid}
                                    ↓
                    AuthContext.onAuthStateChanged
                                    ↓
                         setUser(userData)
                                    ↓
                         MainLayout + Routes
```

### 2. Validação de QR Code
```
VirtualIdCard.tsx → gera QR com UID do usuário
                         ↓
            QR Code contém: /#/validate-id/{uid_base64}
                         ↓
ValidateIdCard.tsx → decode UID → Firestore profiles/{uid}
                         ↓
                 Exibe StudentIdCard
```

### 3. Navegação Mobile
```
index.tsx → ReactDOM.createRoot
                ↓
App.tsx → HashRouter (para suporte a file:// no Android)
                ↓
     MainLayout (Header + BottomNav + Content)
                ↓
        Rotas Filhas (Home, Profile, VirtualId, etc)
```

---

## Decisões Técnicas

### Por que HashRouter?
- React Router com `BrowserRouter` não funciona em apps híbridos com `file://`
- `HashRouter` usa a URL fragment (`#`) para navegação, funcionando offline e em WebView

### Por que Firebase Compat?
- Projeto usa Firebase v8 namespaced API (`firebase/compat/app`)
- Facilita migração gradual e evita quebra de módulos existentes
- Permite usar `firebase.auth()`, `firebase.firestore()` diretamente

### Por que Tailwind CDN?
- Configuração zero inicial
- Funciona em ambiente web e Android WebView
- Desvantagem: bundle maior, sem tree-shaking

---

## Dependências Principais

| Pacote | Versão | Função |
|--------|--------|--------|
| react | 19.1.1 | Framework UI |
| react-dom | 19.1.1 | DOM rendering |
| react-router-dom | v6 | Roteamento |
| firebase/compat | v8 | Backend (Auth, Firestore, Storage) |
| @heroicons/react | 2.2.0 | Ícones |
| tailwindcss | CDN | Estilização |
| genai | SDK | IA Generativa (Gemini) |
| html2canvas | 1.4.1 | Captura de telapar PDF |
| jspdf | 2.5.1 | Geração de PDF |
| capacitor | android | Build mobile |

---

## Ambientes

### Web
- Hospedado no Vercel
- Variáveis de ambiente via Vercel Secrets
- Build: `npm run build` → `dist/`

### Mobile (Android)
- Build automatizado via GitHub Actions
- Gera APK em `public/portal-do-estudante.apk`
- Deploy manual via sideload ou loja

### Desenvolvimento Local
- `npm run dev` → Vite dev server
- Hot reload habilitado
- `.env.local` para variáveis locais
