# Changelog - Correções e Ajustes

**Período:** 2026-07-06  
**Branch:** main  
**Commits analisados:** 459b24e → 891ebe9  

---

## 2026-07-06 - Ajustes de PDF e Build

### Commit: 891ebe9
**Mensagem:** fix: normalize PDF export layout for ID card and class schedule  
**Arquivos:** `pages/VirtualIdCard.tsx`, `pages/ClassSchedule.tsx`

#### Alterações em `VirtualIdCard.tsx`
- **Problema:** PDF da carteirinha saía cortado/esticado, ocupando toda a folha sem proporção
- **Solução:** Mudou de tamanho fixo `85x54mm` para página A4 em `landscape` com margens de 15mm
- **Detalhe:** A carteirinha agora é centralizada proporcionalmente, mantendo o aspect ratio original do canvas
- **Função alterada:** `handleDownloadPDF`

#### Alterações em `ClassSchedule.tsx`
- **Problema:** PDF da grade de aulas também saía com layout bugado, usando tamanho bruto do canvas
- **Solução:** Aplicou a mesma estratégia da carteirinha: página A4, margens, centralização proporcional
- **Nova funcionalidade:** Adicionado botão "Baixar Horário" na página de horário de aulas
- **Função adicionada:** `handleDownloadSchedulePDF`
- **Função alterada:** `handleDownloadSchedulePDF`

---

## 2026-07-06 - Correção de Build

### Commit: d625f5d
**Mensagem:** fix: replace missing heroicon with ArrowDownTrayIcon in ClassSchedule  
**Arquivos:** `pages/ClassSchedule.tsx`

#### Alterações
- **Problema:** Build falhava com erro: `ArrowDownOnRectangleIcon is not exported by @heroicons/react`
- **Solução:** Substituído ícone inexistente por `ArrowDownTrayIcon`, que representa download
- **Linhas alteradas:** importação e uso do ícone no botão de download

---

## 2026-07-06 - Documentação Inicial

### Commit: 0c8e167
**Mensagem:** docs: add complete project audit and analysis  
**Arquivos:** `docs/*.md`

#### Arquivos criados
- `docs/RESUMO_EXECUTIVO.md` - Visão geral da auditoria
- `docs/AUDITORIA_COMPLETA.md` - Auditoria detalhada
- `docs/ARQUITETURA.md` - Arquitetura do sistema
- `docs/FUNCIONALIDADES.md` - Funcionalidades por módulo
- `docs/PROBLEMAS.md` - Problemas encontrados
- `docs/LIXO_TECNICO.md` - Código morto e duplicações
- `docs/ANALISE_ARQUIVO_POR_ARQUIVO.md` - Análise individual

---

## 2026-07-06 - Segurança e Deploy

### Commit: cfb60d9
**Mensagem:** chore: upload APK as GitHub Actions artifact instead of committing it  
**Arquivos:** `.github/workflows/build-apk.yml`

#### Alterações
- Removido step que commitava APK de volta no repositório
- Adicionado `actions/upload-artifact@v4` para armazenar APK como artifact do GitHub Actions
- Resolve problemas de limite de tamanho do GitHub (100MB)

### Commits: 842c0ac, 18302d3, 75ea81d
**Mensagens:**
- `chore: remove apk from versioning and update gitignore`
- `chore: ignore local Kilo and Firebase CLI config files`
- `chore: revert student ID card layout only`

#### Alterações
- Removido `public/portal-do-estudante.apk` do versionamento
- Atualizado `.gitignore` para ignorar APKs, `.kilo/`, `.firebaserc`
- Revertido layout da carteirinha alterado em commit anterior

### Commit: 459b24e
**Mensagem:** chore: upload APK as GitHub Actions artifact instead of committing it  
**Arquivos:** `firestore.rules` (via git filter-repo e reescrita)

#### Alterações
- Removido APK do histórico do Git com `git filter-repo`
- Reescrito histórico local para expurgar objetos grandes
- Readicionado remote origin

---

## Resumo dos Problemas Resolvidos

| Problema | Solução | Status |
|----------|---------|--------|
| PDF carteirinha cortado | A4 landscape com margens | ✅ Resolvido |
| PDF grade de aulas bugada | A4 com proporção correta | ✅ Resolvido |
| Build falhava (ícone inexistente) | Substituído por ArrowDownTrayIcon | ✅ Resolvido |
| APK commitado no repo | Removido do Git, agora artifact | ✅ Resolvido |
| Token exposto no .kilo | Removido do histórico, adicionado no .gitignore | ✅ Resolvido |
| Layout da carteirinha quebrado | Revertido para versão anterior | ✅ Resolvido |
| QR Code não funciona externamente | Aguardando ajuste nas regras do Firestore | ⏳ Pendente |
| Login Google intermitente | Fluxo de redirect consolidado | ⏳ Pendente |

---

## Próximos Passos

1. Corrigir regras do Firestore para permitir leitura pública de `profiles`
2. Remover senha em texto plano do Firestore (`tempPassword`)
3. Consolidar funções duplicadas no `AuthContext.tsx`
4. Limpar imports mortos e comments obsoletos
5. Testar PDFs em dispositivos reais
