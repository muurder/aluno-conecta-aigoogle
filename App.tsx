


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
import ValidateIdCard from './pages/ValidateIdCard';

const isProduction = process.env.NODE_ENV === 'production';

const FirebaseConfigWarning: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-3xl w-full text-left">
                {isProduction ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Erro de Configuração do Servidor</h2>
                        <p className="text-gray-700">O aplicativo não pode se conectar aos serviços de backend.</p>
                        <p className="text-gray-600 mt-2">Por favor, entre em contato com o administrador do sistema.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Guia de Configuração do Firebase</h2>
                        <p className="text-gray-600 mb-8">
                            Siga estes passos para configurar o backend do "Portal do Aluno" com o Firebase e rodar o projeto localmente.
                        </p>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 1:</strong> Crie seu Projeto no Firebase</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Acesse <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">console.firebase.google.com</a>, crie uma conta (ou faça login) e inicie um novo projeto.
                                </p>
                            </div>

                             <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 2:</strong> Configure suas Variáveis de Ambiente</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    No seu projeto Firebase, crie um novo "Aplicativo da Web". O Firebase fornecerá um objeto de configuração com suas chaves.
                                </p>
                                <p className="text-gray-600 text-sm mb-2">
                                    Crie um arquivo <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">.env.local</code> na raiz do projeto e cole o conteúdo abaixo, substituindo pelos seus dados.
                                </p>
                                <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                                    <pre className="text-sm text-gray-700">
                                        <code>
{`# .env.local
# Cole suas chaves do Firebase aqui
VITE_FIREBASE_API_KEY="SUA_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"

# Cole sua chave do Gemini aqui (para o assistente virtual)
API_KEY="SUA_CHAVE_DE_API_DO_GEMINI"`}
                                        </code>
                                    </pre>
                                </div>
                                <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                    <h4 className="font-bold text-yellow-800">Nota para Deploy (Produção)</h4>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Se você está publicando esta aplicação em plataformas como <strong>Vercel</strong> ou <strong>Netlify</strong>, você deve configurar estas mesmas variáveis de ambiente (com o prefixo <code className="bg-yellow-200 text-yellow-900 font-mono p-0.5 rounded-sm text-xs">VITE_</code>) diretamente no painel de configurações do seu projeto na plataforma. O arquivo <code className="bg-yellow-200 text-yellow-900 font-mono p-0.5 rounded-sm text-xs">.env.local</code> é usado apenas para desenvolvimento local.
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 3:</strong> Ative os Serviços do Firebase</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    No painel do Firebase, ative os seguintes serviços:
                                </p>
                                 <ol className="list-decimal list-inside text-gray-600 text-sm space-y-2">
                                    <li>
                                      <strong className="text-gray-800">Authentication:</strong> Vá para a seção "Authentication", clique em "Primeiros passos" e ative o provedor de "E-mail/senha".
                                    </li>
                                    <li>
                                      <strong className="text-gray-800">Firestore Database:</strong> Vá para "Firestore Database", clique em "Criar banco de dados", inicie em <strong className="font-semibold">modo de produção</strong> e escolha um local.
                                    </li>
                                     <li>
                                      <strong className="text-gray-800">Storage:</strong> Vá para "Storage", clique em "Primeiros passos" e configure-o com as regras de segurança padrão.
                                    </li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 4:</strong> Configure as Regras de Segurança</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Para que o aplicativo funcione, você precisa definir regras de segurança para o Firestore e o Storage.
                                </p>
                                 <p className="text-gray-600 text-sm mb-2">
                                    <strong className="text-gray-800">Firestore:</strong> Vá para a aba "Regras" do Firestore e substitua o conteúdo pelo seguinte:
                                </p>
                                <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto max-h-40">
                                    <pre className="text-xs">
                                        <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Perfis: Usuários podem ler e editar seu próprio perfil. Admins podem ler todos.
    match /profiles/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow read, list: if get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Posts: Todos autenticados podem ler. Apenas admins podem criar/deletar.
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create, delete: if get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
      
      // Comentários: Todos autenticados podem ler/criar. Donos e admins podem deletar.
      match /comments/{commentId} {
        allow read, create: if request.auth != null;
        allow delete: if request.auth != null && (request.auth.uid == resource.data.author_uid || get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true);
      }
      
      // Reações: Todos autenticados podem ler/escrever. Donos podem deletar.
      match /reactions/{userId} {
        allow read, write: if request.auth != null;
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
                                        </code>
                                    </pre>
                                </div>
                                 <p className="text-gray-600 text-sm mb-2 mt-4">
                                    <strong className="text-gray-800">Storage:</strong> Vá para a aba "Regras" do Storage e substitua o conteúdo pelo seguinte para permitir que usuários autenticados façam upload:
                                </p>
                                 <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto max-h-40">
                                    <pre className="text-xs">
                                        <code>
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}`}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 5:</strong> Defina o Primeiro Administrador</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Para acessar o painel de administração e postar no mural, você precisa definir um usuário como administrador manualmente.
                                </p>
                                <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                                    <li>Primeiro, <strong className="text-gray-800">crie uma conta para você</strong> na tela de registro do aplicativo.</li>
                                    <li>No painel do Firebase, vá para o <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">Firestore Database</code>.</li>
                                    <li>Selecione a coleção <code className="text-sm font-mono">profiles</code> e encontre o documento correspondente ao seu UID.</li>
                                    <li>Edite o campo <code className="text-sm font-mono">isAdmin</code> de <code className="text-sm font-mono">false</code> para <code className="text-sm font-mono">true</code> (tipo booleano).</li>
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
      <Route path="/validate-id/:data" element={<ValidateIdCard />} />
      
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
  // Checks if all the environment variables for Firebase are set.
  const isFirebaseConfigured = 
    import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'SUA_API_KEY' &&
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
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;