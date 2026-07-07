# Regras do Projeto (Aluno Conecta)

## Incremento Automático de Versão do Aplicativo (APK)

Sempre que você (a IA) fizer alterações no código do aplicativo, implementar novos recursos, correções ou ajustes solicitados pelo usuário:
1. **Identifique a versão atual**:
   * No arquivo `components/UpdateChecker.tsx` (a constante `CURRENT_VERSION`).
   * No arquivo `public/version.json` (o campo `"version"`).
2. **Incremente a versão**:
   * Suba o número da versão em ambos os arquivos de forma sincronizada (ex: de `1.0.0` para `1.0.1` ou `1.1.0` conforme a dimensão da alteração).
3. **Atualize as Notas de Lançamento**:
   * Edite o campo `"releaseNotes"` no arquivo `public/version.json` descrevendo as novidades ou correções exatas que você acabou de implementar.
4. **Suba as alterações**:
   * Faça o commit e push das alterações para que a atualização seja implantada no Vercel e o novo APK seja assinado e gerado com a versão correspondente.
