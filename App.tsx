import React, { useState } from 'react';
// FIX: Update react-router-dom imports to v6. 'Switch' is 'Routes', 'Redirect' is 'Navigate'.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
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
import ClassSchedule from './pages/ClassSchedule';
import Notifications from './pages/Notifications';

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
                                    Crie um arquivo chamado <code>.env.local</code> na raiz do seu projeto e adicione as chaves, como no exemplo abaixo:
                                </p>
                                <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm overflow-x-auto"><code>
{`VITE_FIREBASE_API_KEY=sua_chave_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_dominio_aqui
VITE_FIREBASE_PROJECT_ID=seu_id_de_projeto_aqui
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui

# (Opcional) Chave para a API do Gemini (usada no Assistente Virtual)
API_KEY=sua_chave_do_gemini_aqui`}
                                </code></pre>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 3:</strong> Ative os Serviços do Firebase</h3>
                                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                                    <li><strong>Authentication:</strong> Vá para a aba "Authentication", clique em "Primeiros passos" e ative o provedor "E-mail/senha".</li>
                                    <li><strong>Firestore Database:</strong> Vá para a aba "Firestore Database", clique em "Criar banco de dados", inicie em <strong>modo de produção</strong> e escolha um local.</li>
                                    <li><strong>Storage:</strong> Vá para a aba "Storage", clique em "Primeiros passos" e configure o bucket de armazenamento.</li>
                                </ul>
                            </div>

                             <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 4:</strong> Configure as Regras de Segurança</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                   As regras de segurança são essenciais para proteger seus dados. Vá para as abas "Firestore Database" → "Regras" e "Storage" → "Regras" e cole o conteúdo abaixo.
                                </p>
                                <h4 className="font-semibold text-gray-700 mt-4 mb-2">Regras do Firestore:</h4>
                                <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm overflow-x-auto"><code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite que um usuário crie seu próprio perfil ao se registrar.
    match /profiles/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read, update: if request.auth != null && request.auth.uid == userId;
      // Admins podem ler e escrever em qualquer perfil.
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}`}
                                </code></pre>

                                <h4 className="font-semibold text-gray-700 mt-4 mb-2">Regras do Storage:</h4>
                                <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm overflow-x-auto"><code>
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permite que usuários autenticados façam upload da sua própria foto de perfil.
    match /profile-photos/{userId}/{fileName} {
      allow write: if request.auth != null && request.auth.uid == userId;
      // Todos podem ler as fotos de perfil.
      allow read;
    }
    // Apenas admins podem fazer upload de imagens para os posts.
     match /posts/{fileName} {
      allow write: if request.auth != null && get(/databases/$(database)/documents/firestore/profiles/$(request.auth.uid)).data.isAdmin == true;
      allow read;
    }
  }
}`}
                                </code></pre>
                            </div>

                            <p className="text-center text-gray-700 pt-4 border-t">
                                Após completar estes passos, <strong>reinicie o servidor de desenvolvimento</strong> para que as variáveis de ambiente sejam carregadas.
                            </p>
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
    
    if (isAuthenticated) {
        if (user?.isAdmin) {
            return (
                 <Routes>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/edit-user/:uid" element={<AdminEditUser />} />
                    <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                    <Route path="/my-course" element={<MainLayout><MyCourse /></MainLayout>} />
                    <Route path="/financial" element={<MainLayout><Financial /></MainLayout>} />
                    <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
                    <Route path="/virtual-id" element={<MainLayout><VirtualIdCard /></MainLayout>} />
                    <Route path="/edit-profile" element={<MainLayout><EditProfile /></MainLayout>} />
                    <Route path="/help" element={<MainLayout><Help /></MainLayout>} />
                    <Route path="/validate-id/:data" element={<ValidateIdCard />} />
                    <Route path="/class-schedule" element={<MainLayout><ClassSchedule /></MainLayout>} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            );
        }
        if (user?.status === 'pending') {
            return (
                <Routes>
                    <Route path="/pending-approval" element={<PendingApproval />} />
                    <Route path="*" element={<Navigate to="/pending-approval" replace />} />
                </Routes>
            );
        }
        if (user?.status === 'approved') {
             return (
                <Routes>
                    <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                    <Route path="/my-course" element={<MainLayout><MyCourse /></MainLayout>} />
                    <Route path="/financial" element={<MainLayout><Financial /></MainLayout>} />
                    <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
                    <Route path="/virtual-id" element={<MainLayout><VirtualIdCard /></MainLayout>} />
                    <Route path="/edit-profile" element={<MainLayout><EditProfile /></MainLayout>} />
                    <Route path="/help" element={<MainLayout><Help /></MainLayout>} />
                    <Route path="/validate-id/:data" element={<ValidateIdCard />} />
                    <Route path="/class-schedule" element={<MainLayout><ClassSchedule /></MainLayout>} />
                    <Route path="/notifications" element={<Notifications />} />
                    {/* Redirect admin routes for regular users */}
                    <Route path="/admin/*" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            );
        }
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/validate-id/:data" element={<ValidateIdCard />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);

  // Check for Firebase environment variables.
  useState(() => {
    const firebaseEnv = import.meta.env;
    if (
      firebaseEnv.VITE_FIREBASE_API_KEY &&
      firebaseEnv.VITE_FIREBASE_AUTH_DOMAIN &&
      firebaseEnv.VITE_FIREBASE_PROJECT_ID &&
      firebaseEnv.VITE_FIREBASE_STORAGE_BUCKET &&
      firebaseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID &&
      firebaseEnv.VITE_FIREBASE_APP_ID
    ) {
      setIsFirebaseConfigured(true);
    }
  });

  if (!isFirebaseConfigured) {
    return <FirebaseConfigWarning />;
  }

  return (
    <HashRouter>
      <AuthProvider>
        <NotificationsProvider>
            <div className="mx-auto max-w-sm h-screen flex flex-col bg-white">
            <AppRoutes />
            </div>
        </NotificationsProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
