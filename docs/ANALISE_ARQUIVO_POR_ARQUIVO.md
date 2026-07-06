# Análise Arquivo por Arquivo

## `index.html`
**Função:** Entry point HTML, define viewport, importmap e estilos globais  
**O que funciona:**
- Viewport configurado corretamente para mobile
- CSS variables para tema funcionando
- Carrega `index.tsx` como módulo

**Problemas:**
- Importmap ambíguo com `firebase/` apontando para CDN, conflitando com `firebase.ts` local
- Tailwind via CDN aumenta bundle inicial
- Sem meta tags de SEO/PWA

**Status:** ⚠️ Funciona, mas com risco de conflito de módulos

---

## `index.tsx`
**Função:** Entry point do React, monta a aplicação  
**O que funciona:**
- Renderiza `<App />` em `#root`
- Usa `React.StrictMode`

**Problemas:**
- Nenhum problema identificado

**Status:** ✅ Funciona

---

## `App.tsx`
**Função:** Componente raiz, define providers e rotas  
**O que funciona:**
- Provedores globais carregam corretamente
- Rotas protegidas para usuários autenticados
- Rotas públicas para login/registro
- Loading spinner durante auth

**Problemas:**
- `FirebaseConfigWarning` mostra detalhes sensíveis em produção
- `h-[100dvh]` pode causar scroll jumping em iOS

**Status:** ✅ Funciona

---

## `context/AuthContext.tsx`
**Função:** Gerenciamento de autenticação e perfis de usuário  
**O que funciona:**
- Login email/senha
- Login Google (desktop e mobile)
- Logout
- Criação automática de perfil para Google
- Atualização de `lastAccess` uma vez por sessão
- Listener `onAuthStateChanged` estável
- Notificações push para admin em novos cadastros

**Problemas:**
- `ensureProfileExists` está definida 2 vezes (duplicação)
- `loginWithGoogle` está definida 3 vezes (overwrite acidental)
- Mistura lógica de UI com lógica de negócio
- `compressImage` é definida mas nunca usada

**Status:** ⚠️ Funciona, mas com dívida técnica alta

---

## `context/ThemeContext.tsx`
**Função:** Gerenciamento de temas por universidade  
**O que funciona:**
- Troca de tema via CSS variables
- Temas pré-definidos para universidades
- Persistência em localStorage

**Problemas:**
- Nenhum problema identificado

**Status:** ✅ Funciona

---

## `context/NotificationsContext.tsx`
**Função:** Gerenciamento de notificações do app  
**O que funciona:**
- Lista notificações do Firestore
- Marcar como lida/não lida
- Limpar todas
- Ocultar lidas

**Problemas:**
- Não persiste estado entre sessões
- Sem catch para erros de permissão do Firestore
- `onSnapshot` não está limpo em desmontagem

**Status:** ⚠️ Funciona parcialmente

---

## `layouts/MainLayout.tsx`
**Função:** Layout principal com header, conteúdo e bottom nav  
**O que funciona:**
- Header com avatar e sino de notificações
- Bottom nav fixa com navegação
- Scroll apenas no conteúdo principal
- Safe area para notch do iPhone

**Problemas:**
- `paddingBottom` calc pode não cobrir todos os casos de notch
- Falta fallback para dispositivos sem safe area

**Status:** ✅ Funciona

---

## `components/BottomNav.tsx`
**Função:** Navegação inferior fixa  
**O que funciona:**
- 4 abas com ícones e labels
- Highlight na aba ativa
- Safe area bottom
- Backdrop blur

**Problemas:**
- Nenhum problema identificado

**Status:** ✅ Funciona

---

## `components/StudentIdCard.tsx`
**Função:** Renderiza a carteirinha digital (frente e verso)  
**O que funciona:**
- Frente com logo, foto, nome, curso, RGM, campus, validade
- Verso com disciplinas recomendadas e código
- Layout responsivo (mobile/desktop)
- Suporte a logos de universidades

**Problemas:**
- `getSubjects()` retorna array vazio se curso não mapeado
- Falta fallback para subjects genéricos
- Depende de `COURSE_SUBJECTS` estar sincronizado com cursos reais

**Status:** ✅ Funciona (layout restaurado)

---

## `components/NotificationCarousel.tsx`
**Função:** Carrossel de notificações na home  
**O que funciona:**
- Carrossel horizontal
- Suporte a texto e imagem
- Paginação com indicadores

**Problemas:**
- Nenhum problema identificado

**Status:** ✅ Funciona

---

## `pages/Home.tsx`
**Função:** Página inicial do app  
**O que funciona:**
- Saudação personalizada
- Carrossel de notificações
- Menu rápido de acesso
- Layout responsivo

**Problemas:**
- Carrossel pode travar em muitas notificações

**Status:** ✅ Funciona

---

## `pages/Login.tsx`
**Função:** Página de login  
**O que funciona:**
- Login email/senha
- Login Google
- Validação de campos
- Redirecionamento pós-login
- Toast de erro/sucesso

**Problemas:**
- Sem link "Esqueci minha senha"
- `hasGenAIKey` não é usado para validação
- Falta indicador de carregamento no botão Google

**Status:** ✅ Funciona

---

## `pages/Register.tsx`
**Função:** Página de cadastro de novos usuários  
**O que funciona:**
- Cadastro com email/senha
- Upload de foto
- Seleção de universidade/curso/campus
- Geração automática de RGM e validade
- Criação de perfil no Firestore

**Problemas:**
- Upload de foto sem preview
- Sem validação de CPF/CNPJ (se necessário)
- Falta indicador de força de senha
- Não valida se email já existe antes de tentar criar

**Status:** ✅ Funciona

---

## `pages/PendingApproval.tsx`
**Função:** Página exibida enquanto aguarda aprovação  
**O que funciona:**
- Exibe mensagem de aguardando aprovação
- Layout limpo

**Problemas:**
- Nenhum problema identificado

**Status:** ✅ Funciona

---

## `pages/Profile.tsx`
**Função:** Página de perfil do usuário  
**O que funciona:**
- Exibe dados do usuário
- Menu de opções (carteirinha, editar perfil, ajuda, logout)
- Modal de contato

**Problemas:**
- Menu "Meus Documentos" sem ação definida
- Falta opção de alterar foto diretamente

**Status:** ✅ Funciona

---

## `pages/EditProfile.tsx`
**Função:** Edição de perfil do usuário  
**O que funciona:**
- Edição de dados pessoais
- Edição de dados acadêmicos
- Upload de foto com compressão
- Seleção de tema
- Alteração de senha

**Problemas:**
- Arquivo muito grande (~500 linhas)
- Upload de foto pode falhar sem feedback visual
- Select de campus pode ficar vazio
- Mix de estilos inline e Tailwind

**Status:** ⚠️ Funciona, mas precisa de refatoração

---

## `pages/VirtualIdCard.tsx`
**Função:** Gera QR Code e permite download da carteirinha em PDF  
**O que funciona:**
- Geração de QR Code com UID do usuário
- Download de PDF com frente e verso
- Abas para alternar entre carteirinha e QR
- Layout responsivo

**Problemas:**
- Gera PDF com html2canvas (pode falhar em imagens externas)
- Sem cache de QR Code gerado
- Botão "Solicitar carteirinha física" sem ação
- URL do QR server hardcoded

**Status:** ✅ Funciona (layout restaurado)

---

## `pages/ValidateIdCard.tsx`
**Função:** Lê QR Code e valida estudante  
**O que funciona:**
- Decodifica QR Code (Base64/URL)
- Busca perfil no Firestore via UID
- Exibe toast de sucesso
- Logs detalhados para debug
- Timeout de validação

**Problemas:**
- **FALHA CRÍTICA:** Não lê QR de usuário não autenticado (regra do Firestore bloqueia)
- Erro genérico "Estudante não encontrado" quando permissão negada
- Timeout de 10s pode ser insuficiente em redes lentas
- Decode pode falhar para UIDs com caracteres especiais

**Status:** ❌ Não funciona para leitura externa sem login

---

## `pages/MyCourse.tsx`
**Função:** Chat do curso/disciplina  
**O que funciona:**
- Lista de mensagens
- Envio de mensagens
- Interface de chat com avatares
- Scroll automático para novas mensagens

**Problemas:**
- Chat não persiste mensagens (localStorage apenas)
- Não há sincronização entre usuários
- Composer fixo pode cobrir conteúdo em telas pequenas
- Sem suporte a imagens
- Sem indicador de mensagens não lidas

**Status:** ⚠️ Funciona parcialmente (mock/local)

---

## `pages/Financial.tsx`
**Função:** Exibe boletos e histórico de pagamentos  
**O que funciona:**
- Exibição de boleto atual
- Histórico de pagamentos
- Indicadores visuais de status

**Problemas:**
- Dados mockados (não conecta com API real)
- Sem filtro por data
- Sem busca
- Sem integração com gateway de pagamento

**Status:** ⚠️ Funciona parcialmente (somente visual)

---

## `pages/Notifications.tsx`
**Função:** Central de notificações  
**O que funciona:**
- Lista de notificações
- Marcar como lida/não lida
- Limpar notificações
- Ocultar lidas

**Problemas:**
- Notificações não persistem entre sessões
- Falta animação ao marcar como lida
- Sem notificações push reais

**Status:** ✅ Funciona

---

## `pages/Help.tsx` (Assistente Virtual)
**Função:** Chat com IA generativa (Gemini)  
**O que funciona:**
- Chat com IA
- Sugestões rápidas
- Indicador de digitação
- Histórico de mensagens na sessão
- Streaming de resposta

**Problemas:**
- Requer `GEMINI_API_KEY` configurada
- Sem memória de contexto entre mensagens
- Sem tratamento de erro detalhado
- Loading spinner pode ficar infinito

**Status:** ✅ Funciona (com API key)

---

## `pages/ClassSchedule.tsx`
**Função:** Exibe horários de aula  
**O que funciona:**
- Agrupamento por dia da semana
- Exibição de horário, professor e sala
- Indicador de curso/campus
- Layout limpo

**Problemas:**
- Dados mockados (horários hardcoded)
- Sem sincronização com calendário
- Sem notificação de mudança
- Falta filtro por professor/disciplina

**Status:** ✅ Funciona (somente visual)

---

## `pages/AdminDashboard.tsx`
**Função:** Painel administrativo  
**O que funciona:**
- Estatísticas de usuários (total, aprovados, pendentes)
- Gerenciamento de usuários (aprovar/reprovar/editar)
- Busca e filtros
- Envio de notificações globais
- Seções colapsáveis

**Problemas:**
- Performance: carrega todos os usuários de uma vez
- Falta paginação
- Falta gráficos de evolução
- Falta logs de ações administrativas

**Status:** ✅ Funciona

---

## `pages/AdminEditUser.tsx`
**Função:** Edição de usuário pelo admin  
**O que funciona:**
- Edição completa de perfil
- Upload de foto
- Geração automática de RGM/validade
- Seleção de tema
- Link para redefinição de senha

**Problemas:**
- Permite definir senha manualmente (armazenada em texto plano no Firestore)
- Upload de foto pode falhar sem feedback
- Selects dependentes podem não carregar
- Falta confirmação antes de ações destrutivas

**Status:** ⚠️ Funciona, mas com risco de segurança

---

## `pages/CourseDetail.tsx`
**Função:** Exibe detalhes de um curso  
**O que funciona:**
- Exibição de detalhes do curso
- Lista de disciplinas
- Informações do professor
- Botão de matrícula

**Problemas:**
- Botão "Matricular-se" não tem ação
- Dados mockados (não conecta com catálogo real)
- Sem pré-requisitos ou ementa detalhada

**Status:** ✅ Funciona (somente visual)

---

## `pages/CourseDetail.tsx`
**Função:** Exibe detalhes de um curso  
**O que funciona:**
- Exibição de detalhes do curso
- Lista de disciplinas
- Informações do professor
- Botão de matrícula

**Problemas:**
- Botão "Matricular-se" não tem ação
- Dados mockados (não conecta com catálogo real)
- Sem pré-requisitos ou ementa detalhada

**Status:** ✅ Funciona (somente visual)

---

## `firebase.ts`
**Função:** Inicialização do Firebase (Auth, Firestore, Storage)  
**O que funciona:**
- Carrega configuração de variáveis de ambiente
- Inicializa Firebase apenas se chaves estiverem presentes
- Exporta instâncias de Auth, Firestore e Storage

**Problemas:**
- Nome do arquivo pode conflitar com `firebase.json` em alguns ambientes
- Falta fallback para chaves ausentes em produção

**Status:** ✅ Funciona

---

## `services/genai.ts`
**Função:** Integração com Google Generative AI (Gemini)  
**O que funciona:**
- Inicializa cliente GenAI
- Função `generateResponse` envia mensagens
- Retorna texto da resposta

**Problemas:**
- API key pode estar exposta em logs
- Sem timeout/retry
- Sem tratamento de erro detalhado
- Função `generateResponse` retorna string vazia em erro

**Status:** ⚠️ Funciona com API key, mas frágil

---

## `types.ts`
**Função:** Tipos TypeScript da aplicação  
**O que funciona:**
- Tipos bem definidos para User, Post, Comment, etc.
- Constantes de universidades

**Problemas:**
- Tipo `User` não marca campos obrigatórios vs opcionais claramente
- Falta tipagem para erros de API

**Status:** ✅ Funciona

---

## `constants.tsx`
**Função:** Constantes da aplicação (cursos, subjects, logos)  
**O que funciona:**
- Lista de universidades
- Subjects por curso

**Problemas:**
- `COURSE_SUBJECTS` pode dessincronizar com cursos reais
- Falta fallback para cursos não mapeados

**Status:** ✅ Funciona

---

## `vite.config.ts`
**Função:** Configuração do Vite  
**O que funciona:**
- Alias `@` para raiz do projeto
- Carrega variáveis de ambiente

**Problemas:**
- `define` mistura API keys de serviços diferentes
- Sem configuração de build para produção (code splitting)

**Status:** ✅ Funciona

---

## `capacitor.config.ts`
**Função:** Configuração do Capacitor para mobile  
**O que funciona:**
- Configuração básica para Android
- AppId e nome definidos

**Problemas:**
- Sem configuração de plugins (câmera, geolocalização, etc.)
- Sem config de splash screen

**Status:** ✅ Funciona

---

## `firestore.rules`
**Função:** Regras de segurança do Firestore  
**O que funciona:**
- Regras aplicadas no Firebase
- Proteção de escrita para usuários autenticados
- Função `isAdmin` funcionando

**Problemas:**
- **FALHA CRÍTICA:** `allow read: if true` em `profiles` expõe dados sensíveis
- Necessário para QR, mas risco de privacidade
- Falta regra para `storage` em profile photos

**Status:** ⚠️ Aplicado, mas com risco de segurança

---

## `firebase.json`
**Função:** Configuração do Firebase CLI  
**O que funciona:**
- Aponta para regras do Firestore

**Problemas:**
- Falta configuração de hosting
- Falta configuração de functions

**Status:** ✅ Funciona

---

## `firebase.example.ts`
**Função:** Template de configuração Firebase para desenvolvimento  
**O que funciona:**
- Template claro para novo desenvolvedor

**Problemas:**
- Nenhum problema identificado

**Status:** ✅ Funciona

---

## `README.md`
**Função:** Documentação principal do repositório  
**O que funciona:**
- Estrutura básica

**Problemas:**
- **Desatualizado:** contém links quebrados para ZIP
- Instruções de setup incompletas
- Não menciona variáveis de ambiente
- Não explica como rodar o projeto

**Status:** ❌ Desatualizado

---

## `.github/workflows/build-apk.yml`
**Função:** CI/CD para build do APK Android  
**O que funciona:**
- Checkout do código
- Setup de Java e Node
- Build do web assets
- Sync Capacitor
- Build do APK
- Upload como artifact

**Problemas:**
- JDK 21 pode ser incompatível com versões antigas do Android Gradle Plugin
- Sem cache de dependências do Android
- Sem testes automatizados
- Sem deploy automático para Play Store

**Status:** ✅ Funciona, mas pode quebrar com atualizações

---

## Sumário Final

### Arquivos que funcionam corretamente ✅
- `index.tsx`, `ThemeContext.tsx`, `BottomNav.tsx`, `NotificationCarousel.tsx`
- `Home.tsx`, `Login.tsx`, `Register.tsx`, `PendingApproval.tsx`
- `Profile.tsx` (parcial), `Notifications.tsx`, `ClassSchedule.tsx` (visual)
- `AdminDashboard.tsx`, `CourseDetail.tsx` (visual)
- `firebase.ts`, `types.ts`, `constants.tsx`, `vite.config.ts`, `capacitor.config.ts`
- `firebase.example.ts`, `firebase.json`

### Arquivos com problemas ⚠️
- `App.tsx` (mensagem de produção)
- `AuthContext.tsx` (duplicações)
- `NotificationsContext.tsx` (estado não persistente)
- `MainLayout.tsx` (safe area)
- `StudentIdCard.tsx` (fallback de subjects)
- `EditProfile.tsx` (tamanho e UX)
- `VirtualIdCard.tsx` (hardcoded URL)
- `MyCourse.tsx` (chat mock)
- `Financial.tsx` (dados mockados)
- `AdminEditUser.tsx` (senha em texto plano)
- `genai.ts` (erro frágil)
- `firestore.rules` (exposição de dados)
- `build-apk.yml` (JDK 21)

### Arquivos que não funcionam ❌
- `ValidateIdCard.tsx` (QR para não autenticados)
- `README.md` (desatualizado)
