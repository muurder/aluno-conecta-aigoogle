# Resumo Executivo - Auditoria Aluno Conecta

**Data da Auditoria:** 2026-07-06  
**Auditor:** Kilo (Análise estática e funcional)  
**Branch analisada:** main (commit 459b24e)  
**Escopo:** Código fonte, configurações, workflows e dependências  

---

## Visão Geral

O projeto **Aluno Conecta** é uma aplicação web/mobile híbrida para gestão acadêmica estudantil, com:
- Autenticação via Firebase (email/senha e Google)
- Perfis de usuário com temas por universidade
- Carteirinha digital com QR Code
- Chat de curso (mock/local)
- Assistente IA com Gemini
- Painel administrativo

**Estado geral:** Funcional para uso interno, mas com **problemas críticos de segurança e deploy** que impedem uso em produção seguro.

---

## Status dos Módulos

| Módulo | Status | Observação |
|--------|--------|------------|
| **Login email/senha** | ✅ Funciona | Fluxo padrão Firebase Auth |
| **Login Google** | ⚠️ Intermitente | Popup/redirect pode causar loop |
| **Carteirinha Virtual** | ✅ Funciona | Layout restaurado, PDF exportável |
| **QR Code (geração)** | ✅ Funciona | Gera QR com UID codificado |
| **QR Code (leitura)** | ❌ Não funciona | Bloqueado por regra do Firestore |
| **Home/Navegação** | ✅ Funciona | Bottom nav estável |
| **Chat/Meu Curso** | ⚠️ Mock | Dados locais, sem persistência real |
| **Financeiro** | ⚠️ Mock | Dados hardcoded |
| **Horário de Aulas** | ⚠️ Mock | Dados hardcoded |
| **Notificações** | ✅ Funciona | Somente app, sem push real |
| **Assistente IA** | ✅ Funciona | Requer API key do Gemini |
| **Admin Dashboard** | ✅ Funciona | CRUD de usuários operacional |
| **Edição de Perfil** | ✅ Funciona | Refatoração recomendada |

---

## Problemas Críticos

### 1. 🔴 QR Code não funciona para leitores externos
**Arquivo:** `pages/ValidateIdCard.tsx`, `firestore.rules`  
**Causa:** Regra `allow read: if request.auth != null` impede leitura de perfis por usuários não autenticados  
**Impacto:** QR Code só pode ser lido por quem já está logado no app  
**Solução:** Alterar regra para `allow read: if true` apenas em `/profiles/{userId}` **OU** criar endpoint público com verificação

### 2. 🔴 Senha armazenada em texto plano
**Arquivo:** `pages/AdminEditUser.tsx`  
**Causa:** Campo `tempPassword` é salvo diretamente no Firestore  
**Impacto:** Risco de vazamento de senhas  
**Solução:** Remover `tempPassword` e usar apenas Firebase `sendPasswordResetEmail`

### 3. 🔴 Token do GitHub exposto no repositório
**Arquivo:** `.kilo/kilo.json` (histórico)  
**Causa:** Token commitado em texto plano  
**Impacto:** Acesso não autorizado ao repositório  
**Solução:** ✅ Token removido do histórico com `git filter-repo` e adicionado no `.gitignore`

### 4. 🟠 APK commitado no repositório
**Arquivo:** `public/portal-do-estudante.apk`  
**Causa:** GitHub Actions commitava APK de volta no repo  
**Impacto:** Repositório inchado, push bloqueado pelo GitHub (limite 100MB)  
**Solução:** ✅ Removido do histórico e workflow alterado para usar artifacts

---

## Lixo Técnico Identificado

| Categoria | Quantidade | Arquivos |
|-----------|------------|----------|
| **Imports mortos** | 8 | `AuthContext.tsx`, `ValidateIdCard.tsx`, `VirtualIdCard.tsx` |
| **Funções duplicadas** | 2 | `ensureProfileExists`, `loginWithGoogle` em `AuthContext.tsx` |
| **Comments obsoletos** | 12 | Espalhados por 5 arquivos |
| **Hardcoded URLs** | 3 | `api.qrserver.com`, paths do Firebase |
| **Arquivos desnecessários** | 2 | APK, ZIPs de layout no Git |
| **Dados mockados** | 3 | `MyCourse.tsx`, `Financial.tsx`, `ClassSchedule.tsx` |

---

## Dívida Técnica

### Alta Prioridade
1. Refatorar `AuthContext.tsx` (320+ linhas, funções duplicadas)
2. Refatorar `EditProfile.tsx` (500+ linhas)
3. Corrigir regras do Firestore para QR Code
4. Remover senha em texto plano do Firestore

### Média Prioridade
5. Consolidar fluxo de Google Auth
6. Adicionar recuperação de senha
7. Implementar notificações push reais (FCM)
8. Adicionar testes básicos

### Baixa Prioridade
9. Migrar Tailwind CDN para build local
10. Implementar PWA com service worker
11. Adicionar analytics
12. Internacionalização (i18n)

---

## Recomendações Imediatas

### Segurança (fazer hoje)
1. ✅ Revogar token exposto no GitHub
2. ✅ Remover APK do histórico do Git
3. 🔲 Alterar regra do Firestore para leitura pública de `profiles`
4. 🔲 Remover campo `tempPassword` do Firestore
5. 🔲 Rotacionar chaves Firebase se houve acesso indevido

### Deploy (fazer esta semana)
6. 🔲 Configurar CI/CD correto para Android (JDK compatível)
7. 🔲 Configurar Vercel com variáveis de ambiente
8. 🔲 Testar build de produção localmente

### Código (fazer este mês)
9. 🔲 Limpar imports mortos e comments obsoletos
10. 🔲 Consolidar funções duplicadas
11. 🔲 Refatorar arquivos grandes (`AuthContext.tsx`, `EditProfile.tsx`)
12. 🔲 Substituir dados mockados por integração real

---

## Arquivos de Documentação Gerados

| Arquivo | Descrição |
|---------|-----------|
| `docs/AUDITORIA_COMPLETA.md` | Visão geral da auditoria |
| `docs/ARQUITETURA.md` | Arquitetura do sistema |
| `docs/FUNCIONALIDADES.md` | Funcionalidades por módulo |
| `docs/PROBLEMAS.md` | Problemas encontrados por arquivo |
| `docs/LIXO_TECNICO.md` | Código morto e duplicações |
| `docs/ANALISE_ARQUIVO_POR_ARQUIVO.md` | Análise detalhada de cada arquivo |
| `docs/RESUMO_EXECUTIVO.md` | Este documento |

---

## Conclusão

O projeto Aluno Conecta tem uma base funcional sólida, mas precisa de **correções críticas de segurança** antes de ir para produção. Os principais bloqueadores são:

1. **QR Code não funciona** para validação externa
2. **Senhas em texto plano** no Firestore
3. **Segredos expostos** no histórico do Git

Após resolver esses 3 pontos, o projeto estará em condições de ser usado por alunos e administradores com segurança.

**Próxima ação recomendada:** Corrigir as regras do Firestore e remover o campo `tempPassword`.
