# Funcionalidades do Sistema - Aluno Conecta

## Módulos Principais

### 1. Autenticação e Perfil
**Responsável:** `context/AuthContext.tsx`, `pages/Login.tsx`, `pages/Register.tsx`

**Funciona:**
- Login com email/senha via Firebase Auth
- Registro de novos usuários (cria perfil no Firestore)
- Logout
- Persistência de sessão via `onAuthStateChanged`
- Controle de status (`pending` vs `approved`)
- Upload de foto de perfil com compressão client-side
- Alteração de senha
- Login com Google (desktop e mobile)

**Não funciona / Problemas:**
- Login Google pode ficar em loop se houver redirect pendente
- Sem recuperação de senha por email
- Sem verificação de email

**Dívida técnica:**
- Mistura lógica de criação de perfil com listener de auth
- `ensureProfileExists` duplicado em vários lugares

---

### 2. Home e Navegação Principal
**Responsável:** `pages/Home.tsx`, `layouts/MainLayout.tsx`, `components/BottomNav.tsx`

**Funciona:**
- Exibição de saudação com nome do usuário
- Navegação inferior fixa com 4 abas (Início, Chat, Financeiro, Perfil)
- Notificações com badge de não lidas
- Animação de sino para novas notificações
- Layout responsivo mobile-first

**Não funciona / Problemas:**
- Nenhum problema crítico identificado

---

### 3. Carteirinha Virtual
**Responsável:** `pages/VirtualIdCard.tsx`, `components/StudentIdCard.tsx`

**Funciona:**
- Geração de QR Code com UID do usuário
- Download de PDF com frente e verso da carteirinha
- Validação de estudante via QR Code
- Exibição de dados do aluno (nome, RGM, curso, validade)

**Não funciona / Problemas:**
- Leitura de QR Code em dispositivo não autenticado falha por regras do Firestore
- Layout pode quebrar em resoluções muito pequenas

**Dívida técnica:**
- `handleDownloadPDF` não trata erro de imagem não carregada
- QR URL hardcoded com `api.qrserver.com`

---

### 4. Validação de Carteirinha
**Responsável:** `pages/ValidateIdCard.tsx`

**Funciona:**
- Decodifica QR Code (Base64/URL)
- Busca perfil no Firestore via UID
- Exibe toast de sucesso
- Logs detalhados para debug

**Não funciona / Problemas:**
- **FALHA CRÍTICA:** Não lê QR de usuário não autenticado (regra do Firestore bloqueia)
- Erro genérico "Estudante não encontrado" quando permissão negada
- Timeout de 10s pode ser insuficiente em redes lentas

**Dívida técnica:**
- Mistura lógica de decode com state do componente
- Falta fallback para busca por email/login se UID falhar

---

### 5. Chat / Meu Curso
**Responsável:** `pages/MyCourse.tsx`

**Funciona:**
- Lista de mensagens
- Envio de mensagens
- Interface de chat com avatares

**Não funciona / Problemas:**
- Não há persistência real de mensagens (apenas local)
- Não há sincronização entre usuários
- Composer fixo pode cobrir conteúdo em telas pequenas

**Dívida técnica:**
- Usa `localStorage` ao invés de Firestore
- Sem indicador de mensagens não lidas

---

### 6. Financeiro
**Responsável:** `pages/Financial.tsx`, `pages/Financial.tsx` (subcomponentes)

**Funciona:**
- Exibição de boletos
- Indicador de boleto atual
- Histórico de pagamentos

**Não funciona / Problemas:**
- Dados mockados (não conecta com API real)
- Sem filtro por data
- Sem busca

**Dívida técnica:**
- Tudo é hardcoded; precisa de integração real

---

### 7. Notificações
**Responsável:** `pages/Notifications.tsx`, `context/NotificationsContext.tsx`

**Funciona:**
- Lista de notificações
- Marcar como lida/não lida
- Limpar notificações
- Toggle para ocultar lidas

**Não funciona / Problemas:**
- Notificações do sistema não funcionam no mobile
- Somente admin pode criar notificações globais

**Dívida técnica:**
- `NotificationsContext` não persiste estado em localStorage
- Sem suporte a notificações push reais (FCM)

---

### 8. Suporte IA (Assistente Virtual)
**Responsável:** `pages/Help.tsx`, `services/genai.ts`

**Funciona:**
- Chat com IA generativa (Gemini)
- Sugestões rápidas de perguntas
- Indicador de digitação
- Histórico de mensagens na sessão

**Não funciona / Problemas:**
- Requer `GEMINI_API_KEY` configurada
- Sem memória de longo prazo
- streaming pode falhar se a API retornar erro

**Dívida técnica:**
- `genai.ts` não trata erros de API
- Sem timeout/retry

---

### 9. Administração
**Responsável:** `pages/AdminDashboard.tsx`, `pages/AdminEditUser.tsx`

**Funciona:**
- Dashboard com estatísticas de usuários
- Gerenciamento de usuários (aprovar/reprovar/editar)
- Envio de notificações push
- Busca e filtros de usuários
- Geração automática de RGM e validade

**Não funciona / Problemas:**
- Aprovação em massa não existe
- Sem logs de ações administrativas
- Notificações push só funcionam se FCM configurado

**Dívida técnica:**
- `AdminDashboard` mistura UI com lógica de Firebase
- Falta paginação na lista de usuários

---

### 10. Perfil do Usuário
**Responsável:** `pages/Profile.tsx`, `pages/EditProfile.tsx`

**Funciona:**
- Visualização de dados do perfil
- Edição de informações pessoais
- Upload de foto com preview
- Seleção de tema/universidade
- Alteração de senha

**Não funciona / Problemas:**
- Sem vinculação com redes sociais
- Sem exportação de dados (GDPR)

**Dívida técnica:**
- `EditProfile.tsx` tem 500+ linhas, precisa de refatoração

---

### 11. Cronograma de Aulas
**Responsável:** `pages/ClassSchedule.tsx`

**Funciona:**
- Agrupamento por dia da semana
- Exibição de horário, professor e sala
- Indicador de curso/campus

**Não funciona / Problemas:**
- Dados mockados (não conecta com API real)
- Sem sincronização com calendário do sistema
- Sem notificações de mudança de horário

**Dívida técnica:**
- Tudo é hardcoded; precisa de integração real

---

## Problemas Críticos Não Relacionados a Funcionalidades

### Segurança
1. **Firestore Rules:** `profiles` tem leitura pública (`allow read: if true`)
   - Exposto: nome, curso, RGM, validade, foto
   - Recomendação: considerar leitura autenticada + cache para QR

2. **Senha no Firestore:** `AdminEditUser.tsx` permite definir senha manualmente
   - Senha fica em texto plano no Firestore
   - Recomendação: remover campo `tempPassword` e usar apenas reset email

3. **Token exposto:** `.kilo/kilo.json` teve token do GitHub commitado
   - Ação tomada: removido do histórico com `git filter-repo`
   - Ação tomada: adicionado no `.gitignore`

### Performance
1. **Bundle grande:** ~2MB gzip após build
   - Causa: Tailwind CDN + ícones Heroicons + Firebase completo
   - Recomendação: considerar PWA com service worker

2. **HTML2Canvas no PDF:** bloqueia UI durante geração
   - Recomendação: usar Web Worker ou loading skeleton

### Manutenibilidade
1. **Código duplicado:** `ensureProfileExists` em `AuthContext.tsx` e `ValidateIdCard.tsx`
2. **Imports mortos:**vários arquivos importam módulos não usados
3. **Comments obsoletos:** "FIX:" espalhados pelo código
4. **Hardcoded URLs:** `api.qrserver.com` inline

---

## Recomendações de Prioridade

### Alta Prioridade
1. Corrigir regra do Firestore para leitura de `profiles` (QR funciona)
2. Remover senha do Firestore (`tempPassword`)
3. Limpar imports mortos e comments obsoletos

### Média Prioridade
4. Consolidar fluxo de Google Auth
5. Adicionar recuperação de senha
6. Implementar notificações push reais (FCM)

### Baixa Prioridade
7. Migrar Tailwind CDN para build local
8. Adicionar testes básicos
9. Implementar PWA
