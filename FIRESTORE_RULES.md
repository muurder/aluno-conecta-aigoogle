# Firestore Rules — versão atual + ajuste QR

Abaixo está o arquivo completo `firestore.rules` para substituir o atual.
Alteração em relação às suas regras: leitura pública da coleção `profiles` no nível raiz, mantendo toda a proteção anterior para subpastas e escrita. Isso permite validar QR sem login, sem expor postagens, comentários ou reações.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras dos perfis de usuário
    // Ajuste: leitura pública habilitada para validação de QR sem login.
    match /profiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
      
      // Permitir leitura e escrita de curtidas nas fotos de perfil
      match /photoLikes/{likeId} {
        allow read, write: if request.auth != null;
      }
      
      // Permitir leitura e escrita de status de leitura/descarte das notificações
      match /notificationStatus/{notificationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Regras do Bate-papo/Chat
    match /chat/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow update: if request.auth != null;
    }
    
    // Regras das Notificações
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    
    // Regras dos Posts do Mural
    match /posts/{postId} {
      allow read, write: if request.auth != null;
      
      match /comments/{commentId} {
        allow read, write: if request.auth != null;
      }
      match /reactions/{reactionId} {
        allow read, write: if request.auth != null;
      }
    }

    // Função auxiliar para verificar se o usuário atual é Administrador
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/profiles/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Como aplicar

```bash
npx firebase-tools deploy --only firestore:rules --project alunoconecta-a3767
```

## Importante

- A abertura de leitura foi feita apenas em `/profiles/{userId}`.
- As subpastas `photoLikes` e `notificationStatus` continuam protegidas para `request.auth != null`.
- Todas as escritas seguem protegidas.
- Se quiser reverter depois, basta restaurar a regra anterior para `allow read, write: if request.auth != null;` dentro de `/profiles/{userId}`.
