
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Home from './pages/Home';
import Profile from './pages/Profile';
import VirtualIdCard from './pages/VirtualIdCard';
import EditProfile from './pages/EditProfile';
import MainLayout from './layouts/MainLayout';
import MyCourse from './pages/MyCourse';
import Financial from './pages/Financial';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import AdminEditUser from './pages/AdminEditUser';

const isProduction = import.meta.env.PROD;

const FirebaseConfigWarning: React.FC = () => {
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Perfis: Usuários podem ler e escrever seus próprios perfis. Admins podem ler/escrever todos.
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow create: if request.auth != null;
    }

    // Posts: Usuários autenticados podem ler. Admins podem criar/deletar.
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      
      // Comentários: Usuários autenticados podem ler/criar. Podem deletar seus próprios comentários, admins podem deletar qualquer um.
      match /comments/{commentId} {
        allow read, create: if request.auth != null;
        allow delete: if request.auth != null && (resource.data.author_uid == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      }
      
      // Reações: Usuários autenticados podem ler. Podem criar/deletar suas próprias reações.
      match /reactions/{reactionId} {
         allow read: if request.auth != null;
         allow create, delete: if request.auth != null && request.resource.data.user_uid == request.auth.uid;
      }
    }
  }
}`;
    const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /post_images/{allPaths=**} {
      allow read;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    match /profile_photos/{userId} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-3xl w-full text-left">
                {isProduction ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Erro de Configuração do Servidor</h2>
                        <p className="text-gray-700">O aplicativo não pode se conectar ao banco de dados.</p>
                        <p className="text-gray-600 mt-2">Por favor, entre em contato com o administrador do sistema.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Guia de Configuração do Firebase</h2>
                        <p className="text-gray-600 mb-8">
                            Siga estes passos para configurar o backend do "Portal do Aluno" com o Firebase.
                        </p>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 1:</strong> Crie seu Projeto no Firebase</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Acesse <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">console.firebase.google.com</a>, crie uma conta (ou faça login) e inicie um novo projeto.
                                </p>
                            </div>

                             <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 2:</strong> Adicione um App Web e Obtenha as Chaves</h3>
                                <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                                    <li>No painel do seu projeto, clique no ícone da Web (<code className="text-sm font-mono">&lt;/&gt;</code>) para adicionar um novo aplicativo da Web.</li>
                                    <li>Dê um nome ao seu aplicativo e registre-o.</li>
                                    <li>O Firebase exibirá um objeto de configuração. Copie os valores dele.</li>
                                </ol>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 3:</strong> Configure suas Variáveis de Ambiente</h3>
                                 <p className="text-gray-600 text-sm mb-2">
                                    Crie um arquivo <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">.env.local</code> na raiz do projeto e cole o conteúdo abaixo, substituindo pelos dados do seu Firebase.
                                </p>
                                <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                                    <pre className="text-sm text-gray-700">
                                        <code>
{`# .env.local
VITE_FIREBASE_API_KEY="SUA_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"

# Cole sua chave do Gemini aqui (para o assistente virtual)
VITE_GEMINI_API_KEY="SUA_CHAVE_DE_API_DO_GEMINI"`}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 4:</strong> Ative os Serviços do Firebase</h3>
                                <ol className="list-decimal list-inside text-gray-600 text-sm space-y-2">
                                    <li>No menu esquerdo, vá para <strong className="text-gray-800">Authentication</strong>, clique em "Começar" e ative o provedor <strong className="text-gray-800">E-mail/senha</strong>.</li>
                                    <li>No menu esquerdo, vá para <strong className="text-gray-800">Firestore Database</strong>, clique em "Criar banco de dados", inicie em <strong className="text-gray-800">modo de produção</strong> e escolha um local.</li>
                                    <li>No menu esquerdo, vá para <strong className="text-gray-800">Storage</strong>, clique em "Começar" e siga as instruções para criar um bucket de armazenamento.</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 5:</strong> Configure as Regras de Segurança</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                   Copie e cole as regras abaixo nas seções apropriadas do seu painel Firebase para garantir que os dados estejam seguros.
                                </p>
                                <h4 className="font-semibold text-gray-700 mt-3 mb-1">Regras do Firestore:</h4>
                                <p className="text-xs text-gray-500 mb-2">Vá para Firestore Database &gt; Regras e substitua o conteúdo.</p>
                                <div className="bg-gray-800 text-white p-3 rounded-md max-h-40 overflow-auto"><pre className="text-xs"><code>{firestoreRules}</code></pre></div>
                                
                                <h4 className="font-semibold text-gray-700 mt-4 mb-1">Regras do Storage:</h4>
                                <p className="text-xs text-gray-500 mb-2">Vá para Storage &gt; Regras e substitua o conteúdo.</p>
                                <div className="bg-gray-800 text-white p-3 rounded-md max-h-40 overflow-auto"><pre className="text-xs"><code>{storageRules}</code></pre></div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 6:</strong> Defina o Primeiro Administrador</h3>
                                <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                                    <li>Primeiro, <strong className="text-gray-800">crie uma conta para você</strong> na tela de registro do aplicativo.</li>
                                    <li>No painel do Firebase, vá para <strong className="text-gray-800">Firestore Database</strong>.</li>
                                    <li>Você verá uma coleção chamada <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">users</code>. Clique nela.</li>
                                    <li>Encontre o documento que corresponde ao seu UID de usuário (você pode encontrá-lo na aba <strong className="text-gray-800">Authentication &gt; Users</strong>).</li>
                                    <li>Dentro do documento, clique em <strong className="text-gray-800">Adicionar campo</strong>. Defina o nome do campo como <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">isAdmin</code>, o tipo como <code className="text-sm font-mono">boolean</code>, e o valor como <code className="text-sm font-mono">true</code>.</li>
                                </ol>
                            </div>

                            <div className="border-t pt-4 text-center">
                                <p className="text-gray-700 font-semibold">Após seguir estes passos, atualize a página.</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.status === 'pending') {
    return (
      <Routes>
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="*" element={<Navigate to="/pending" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={isAuthenticated ? <MainLayout><Home /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/profile" element={isAuthenticated ? <MainLayout><Profile /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/virtual-id" element={isAuthenticated ? <VirtualIdCard /> : <Navigate to="/login" />} />
      <Route path="/edit-profile" element={isAuthenticated ? <EditProfile /> : <Navigate to="/login" />} />
      <Route path="/my-course" element={isAuthenticated ? <MainLayout><MyCourse /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/financial" element={isAuthenticated ? <MainLayout><Financial /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/help" element={isAuthenticated ? <MainLayout><Help /></MainLayout> : <Navigate to="/login" />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={isAuthenticated && user?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
      <Route path="/admin/edit-user/:uid" element={isAuthenticated && user?.isAdmin ? <AdminEditUser /> : <Navigate to="/" />} />
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const isFirebaseConfigured = 
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'SUA_API_KEY' &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID;

  if (!isFirebaseConfigured) {
    return <FirebaseConfigWarning />;
  }

  return (
    <HashRouter>
      <AuthProvider>
        <div className="mx-auto max-w-sm h-[100dvh] flex flex-col bg-gray-100 shadow-2xl">
           <AppRoutes />
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
