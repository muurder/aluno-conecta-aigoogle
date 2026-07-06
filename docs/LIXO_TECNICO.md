# Lixo Técnico Identificado

## Código Morto

### Imports não utilizados
| Arquivo | Import | Linha |
|---------|--------|-------|
| `context/AuthContext.tsx` | `QuerySnapshot`, `Timestamp`, `AuthUser` | 7-9 |
| `context/AuthContext.tsx` | `compressImage` | 11-42 |
| `components/StudentIdCard.tsx` | `InformationCircleIcon` | Removido no commit 1b6354e |
| `pages/ValidateIdCard.tsx` | `PUBLIC_FIELDS` | 9-12 |
| `pages/VirtualIdCard.tsx` | `User` import | Linha 8 |

### Funções/Componentes não utilizados
| Arquivo | Item | Observação |
|---------|------|------------|
| `context/AuthContext.tsx` | `compressImage` | Definida mas nunca chamada |
| `pages/Home.tsx` | Componentes de UI | Seções comentadas |
| `pages/Profile.tsx` | Menu "Meus Documentos" | Sem ação definida |

---

## Duplicações

### `ensureProfileExists`
- **Local 1:** `context/AuthContext.tsx:75-118`
- **Local 2:** `context/AuthContext.tsx:291-334` (após reescrita)
- **Impacto:** Manutenção duplicada, risco de divergência

### `loginWithGoogle`
- **Local 1:** `context/AuthContext.tsx:219-237`
- **Local 2:** `context/AuthContext.tsx:243-255`
- **Local 3:** `context/AuthContext.tsx:279-289`
- **Impacto:** Overwrite acidental, comportamento imprevisível

---

## Hardcoded Values

| Arquivo | Valor | Problema |
|---------|-------|----------|
| `services/genai.ts` | API key direto | Deve vir de env |
| `pages/Help.tsx` | URL do QR server | `api.qrserver.com` hardcoded |
| `pages/ValidateIdCard.tsx` | Timeout 1500ms | Muito curto para redes lentas |
| `context/AuthContext.tsx` | `storage.ref(`profile-photos/...`)` | Path hardcoded |

---

## Comments Obsoletos

| Arquivo | Comment | Problema |
|---------|---------|----------|
| `pages/Login.tsx` | `// FIX: Use navigate(-1)...` | Já foi corrigido |
| `pages/VirtualIdCard.tsx` | `// FIX: Update react-router-dom...` | Já foi corrigido |
| `pages/VirtualIdCard.tsx` | `// FIX: Use navigate(-1)...` | Já foi corrigido |
| `context/AuthContext.tsx` | `// FIX: Refactored listener...` | Código limpo, comentário desnecessário |
| `context/AuthContext.tsx` | `// FIX: Refactored auth call...` | Código limpo, comentário desnecessário |

---

## Arquivos Desnecessários

| Arquivo | Observação |
|---------|------------|
| `public/portal-do-estudante.apk` | 95MB+ commitado, removido |
| `layouts/aluno_conecta_aigoogle_v3.1.zip` | ZIP de布局, pode ser artifacts |
| `dist/` | Build output, deve estar no .gitignore |

---

## Configurações Problemáticas

### `.gitignore`
- ✅ Adicionado: `.kilo/`, `.firebaserc`
- ✅ Adicionado: `*.apk`, `*.aab`, `*.apks`
- ❌ Faltando: `dist/`, `out/`, `build/`

### `package.json`
- Dependências misturadas com devDependencies
- Falta `lint` e `typecheck` nos scripts

---

## Recomendações de Limpeza

1. Remover imports mortos identificados
2. Consolidar `ensureProfileExists` em uma única função
3. Remover comments `// FIX:` obsoletos
4. Mover API keys para `.env.local`
5. Remover ZIPs de layout do Git
6. Adicionar `dist/` e `out/` no `.gitignore`
7. Separar dependências de produção vs dev
8. Adicionar scripts de lint/typecheck
