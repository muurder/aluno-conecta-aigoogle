# Problemas Encontrados por Arquivo

## Arquivos de Entrada

### `index.html`
- **Problema:** Importmap ambíguo com `firebase/` apontando para CDN, podendo conflitar com `firebase.ts`
- **Status:** ⚠️ Potencial conflito em build de produção
- **Solução sugerida:** Remover importmap ou usar paths absolutos `@/firebase`

### `index.tsx`
- **Status:** ✅ Funciona
- **Observação:** Entry point limpo, sem problemas

### `App.tsx`
- **Status:** ✅ Funciona
- **Problema menor:** `FirebaseConfigWarning` mostra segredos esperados em produção
- **Solução sugerida:** Mensagem genérica sem detalhes de config

---

## Contextos

### `context/AuthContext.tsx`
- **Status:** ⚠️ Funciona com ressalvas
- **Problemas:**
  1. `ensureProfileExists` duplicado (linha ~75 e ~291)
  2. `loginWithGoogle` definida 3 vezes (overwrite acidental)
  3. Mistura lógica de negócio com UI state
  4. Não trata erro de permissão do Firestore durante criação de perfil
- **O que funciona:**
  - Login email/senha
  - Logout
  - onAuthStateChanged com atualização de tema
  - Criação automática de perfil para Google

### `context/ThemeContext.tsx`
- **Status:** ✅ Funciona
- **Observação:** Implementação limpa de temas com CSS variables

### `context/NotificationsContext.tsx`
- **Status:** ⚠️ Funciona parcialmente
- **Problemas:**
  1. Não persiste estado em localStorage
  2. Query `onSnapshot` não tem catch para erros de permissão
  3. `markAllAsRead` itera todos os docs localmente (performance)

---

## Layouts

### `layouts/MainLayout.tsx`
- **Status:** ✅ Funciona
- **Problema menor:** `paddingBottom` calc pode não cobrir todos os casos de notch
- **Solução sugerida:** Usar `env(safe-area-inset-bottom)` diretamente

---

## Componentes

### `components/BottomNav.tsx`
- **Status:** ✅ Funciona
- **Observação:** Navegação fixa com backdrop blur

### `components/StudentIdCard.tsx`
- **Status:** ✅ Funciona (layout restaurado)
- **Problema menor:** `getSubjects()` retorna array vazio se curso não mapeado
- **Solução sugerida:** Fallback para subjects genéricos

### `components/NotificationCarousel.tsx`
- **Status:** ✅ Funciona
- **Observação:** Componente de carrossel simples

---

## Páginas

### `pages/Home.tsx`
- **Status:** ✅ Funciona
- **Problema menor:** Carrossel de notificações pode travar em muitas notificações

### `pages/Login.tsx`
- **Status:** ✅ Funciona
- **Problemas:**
  1. Sem link "Esqueci minha senha"
  2. `hasGenAIKey` não é usado para validação de formulário
- **O que funciona:**
  - Login email/senha
  - Login Google
  - Validação de campos
  - Redirecionamento pós-login

### `pages/Register.tsx`
- **Status:** ✅ Funciona
- **Problemas:**
  1. Upload de foto sem preview
  2. Sem validação de CPF/CNPJ (se necessário)
  3. Falta indicador de força de senha

### `pages/PendingApproval.tsx`
- **Status:** ✅ Funciona
- **Observação:** Página simples de aguardando aprovação

### `pages/Profile.tsx`
- **Status:** ✅ Funciona
- **Problema menor:** Menu "Meus Documentos" não tem ação definida

### `pages/EditProfile.tsx`
- **Status:** ⚠️ Funciona parcialmente
- **Problemas:**
  1. Arquivo muito grande (~500 linhas)
  2. Upload de foto pode falhar sem feedback visual
  3. Select de campus pode ficar vazio se universidade não tiver campi
- **O que funciona:**
  - Edição de dados pessoais
  - Edição de dados acadêmicos
  - Seleção de tema
  - Alteração de senha

### `pages/VirtualIdCard.tsx`
- **Status:** ✅ Funciona (layout restaurado)
- **Problemas:**
  1. Gera PDF com html2canvas (pode falhar em imagens externas)
  2. Sem cache de QR Code gerado
  3. Botão "Solicitar carteirinha física" não tem ação

### `pages/ValidateIdCard.tsx`
- **Status:** ❌ NÃO FUNCIONA para leitura externa
- **Problema CRÍTICO:**
  - Bloqueado por regra do Firestore (`request.auth != null`)
  - QR Code só funciona se leitor já estiver autenticado no app
- **O que funciona:**
  - Decodificação de QR Code
  - Logs de debug
  - Timeout de validação

### `pages/MyCourse.tsx`
- **Status:** ⚠️ Funciona parcialmente
- **Problemas:**
  1. Chat não persiste mensagens (localStorage apenas)
  2. Composer fixo pode cobrir botão de enviar
  3. Sem suporte a imagens no chat
- **O que funciona:**
  - Lista de mensagens
  - Envio de texto
  - Interface básica de chat

### `pages/Financial.tsx`
- **Status:** ⚠️ Funciona parcialmente
- **Problemas:**
  1. Dados mockados (boletos hardcoded)
  2. Sem integração real com gateway de pagamento
  3. Sem filtro por data/status
- **O que funciona:**
  - Exibição de boleto atual
  - Histórico de pagamentos
  - Indicadores visuais

### `pages/Notifications.tsx`
- **Status:** ✅ Funciona
- **Problemas:**
  1. Notificações não persistem entre sessões
  2. Falta animação ao marcar como lida
- **O que funciona:**
  - Lista de notificações
  - Marcar como lida/não lida
  - Ocultar lidas
  - Limpar todas

### `pages/Help.tsx` (Assistente Virtual)
- **Status:** ✅ Funciona (com API key)
- **Problemas:**
  1. Sem memória de contexto entre mensagens
  2. Sem tratamento de erro detalhado da API Gemini
  3. Loading spinner pode ficar infinito se API falhar
- **O que funciona:**
  - Chat com IA
  - Sugestões rápidas
  - Streaming de resposta

### `pages/ClassSchedule.tsx`
- **Status:** ✅ Funciona
- **Problemas:**
  1. Dados mockados (horários hardcoded)
  2. Sem sincronização com calendário
  3. Sem notificação de mudança de sala/horário
- **O que funciona:**
  - Agrupamento por dia
  - Exibição de horários
  - Indicadores de professor/sala

### `pages/AdminDashboard.tsx`
- **Status:** ✅ Funciona
- **Problemas:**
  1. Performance: carrega todos os usuários de uma vez
  2. Falta paginação
  3. Falta gráficos de evolução temporal
- **O que funciona:**
  - Estatísticas de usuários
  - Gerenciamento de usuários
  - Busca e filtros
  - Envio de notificações

### `pages/AdminEditUser.tsx`
- **Status:** ⚠️ Funciona com ressalvas
- **Problemas:**
  1. Permite definir senha manualmente (armazenada em texto plano)
  2. Upload de foto pode falhar sem feedback
  3. Selects dependentes (universidade → campus) podem não carregar
- **O que funciona:**
  - Edição completa de usuário
  - Upload de foto
  - Geração automática de RGM/validade
  - Seleção de tema

### `pages/CourseDetail.tsx`
- **Status:** ✅ Funciona
- **Problema menor:** Botão "Matricular-se" não tem ação
- **O que funciona:**
  - Exibição de detalhes do curso
  - Lista de disciplinas
  - Informações do professor

---

## Configuração

### `firebase.ts`
- **Status:** ✅ Funciona
- **Observação:** Usa variáveis de ambiente corretamente
- **Problema:** Nome do arquivo pode conflitar com `firebase.json` em alguns ambientes

### `firebase.example.ts`
- **Status:** ✅ Documentação
- **Observação:** Template para configuração local

### `firestore.rules`
- **Status:** ⚠️ Aplicado mas com problema
- **Problema CRÍTICO:**
  - `match /profiles/{userId}` tem `allow read: if true`
  - Qualquer pessoa pode ler dados de alunos sem autenticação
  - Necessário para QR, mas expõe dados sensíveis

### `firebase.json`
- **Status:** ✅ Configurado
- **Observação:** Aponta para regras e hosting

### `vite.config.ts`
- **Status:** ✅ Funciona
- **Problema menor:** `define` mistura API keys (Gemini + Firebase)

### `capacitor.config.ts`
- **Status:** ✅ Funciona
- **Observação:** Configuração básica para Android

### `types.ts`
- **Status:** ✅ Funciona
- **Problema menor:** Tipo `User` não marca campos opcionais corretamente

### `constants.tsx`
- **Status:** ✅ Funciona
- **Observação:** Concentra constantes de cursos e universidades

### `schedules.ts`
- **Status:** ✅ Funciona
- **Observação:** Dados mockados de horários

### `services/genai.ts`
- **Status:** ⚠️ Funciona com API key
- **Problemas:**
  1. Sem tratamento de erro robusto
  2. Sem timeout/retry
  3. Logs sensíveis podem vazar API key

---

## GitHub Actions

### `.github/workflows/build-apk.yml`
- **Status:** ✅ Funciona
- **Problema:** Já commitou APK no passado (agora usando artifact)
- **Observação:** Usa JDK 21, que pode ser incompatível com versões antigas do Android Gradle Plugin

---

## Documentação

### `README.md`
- **Status:** ❌ Desatualizado
- **Problemas:**
  1. Links quebrados para ZIP do layout
  2. Instruções de setup incompletas
  3. Não menciona variáveis de ambiente necessárias

### `FIRESTORE_RULES.md`
- **Status:** ✅ Documentação útil
- **Observação:** Explica as regras customizadas

---

## Resumo de Problemas Críticos

| Arquivo | Problema | Impacto |
|---------|----------|---------|
| `ValidateIdCard.tsx` | Regra do Firestore bloqueia leitura pública | QR não funciona para não autenticados |
| `firestore.rules` | `allow read: if true` em profiles | Exposição de dados sensíveis |
| `AdminEditUser.tsx` | Senha em texto plano no Firestore | Risco de segurança |
| `AuthContext.tsx` | Funções duplicadas | Manutenibilidade |
| `README.md` | Desatualizado | Onboarding difícil |
| `MyCourse.tsx` | Chat sem persistência | Funcionalidade limitada |
| `Financial.tsx` | Dados mockados | Não funcional para produção |
| `ClassSchedule.tsx` | Dados mockados | Não funcional para produção |
