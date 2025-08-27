import React, { useState } from 'react';
// FIX: Downgrading react-router-dom from v6 to v5 to fix module export errors.
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom';
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
                        
                        <div className="space-y-6 text-sm text-gray-700">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 1:</strong> Crie seu Projeto no Firebase</h3>
                                <p>
                                    Acesse <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">console.firebase.google.com</a>, crie uma conta (ou faça login) e inicie um novo projeto.
                                </p>
                            </div>

                             <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 2:</strong> Configure suas Variáveis de Ambiente</h3>
                                <p className="mb-2">
                                    No seu projeto Firebase, vá em "Configurações do Projeto" (ícone de engrenagem) e crie um novo "Aplicativo da Web". O Firebase fornecerá um objeto de configuração com suas chaves.
                                </p>
                                <p className="mb-2">
                                    Crie um arquivo chamado <code>.env.local</code> na raiz do seu projeto e adicione as chaves, como no exemplo abaixo:
                                </p>
                                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto"><code>
{`VITE_FIREBASE_API_KEY=sua_chave_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_dominio_aqui
VITE_FIREBASE_PROJECT_ID=seu_id_de_projeto_aqui
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui`}
                                </code></pre>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 3:</strong> Ativar Autenticação e Banco de Dados</h3>
                                <ul className="list-disc list-inside space-y-2 pl-2">
                                    <li>No menu do Firebase, vá para <strong>Authentication</strong>, clique em "Começar" e na aba "Sign-in method", ative o provedor <strong>E-mail/senha</strong>.</li>
                                    <li>Em seguida, vá para <strong>Firestore Database</strong>, clique em "Criar banco de dados" e inicie no <strong>modo de produção</strong>.</li>
                                    <li>Finalmente, vá para <strong>Storage</strong> e clique em "Começar", usando as configurações padrão.</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-red-500">Passo 4 (Crítico):</strong> Configurar Regras do Firestore</h3>
                                <p className="mb-2">
                                    Esta é a etapa mais importante para corrigir os problemas de notificação e permissões. No menu <strong>Firestore Database</strong>, vá para a aba <strong>Regras</strong> e substitua o conteúdo existente pelo código abaixo:
                                </p>
                                <pre className="bg-gray-800 text-white p-4 rounded-lg text-xs overflow-x-auto"><code>
{`rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return exists(/databases/$(database)/documents/profiles/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }

    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isAdmin();
      allow delete: if isAdmin();

      match /notificationStatus/{notificationId} {
        allow read, write, delete: if request.auth.uid == userId;
      }
    }

    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if isAdmin();
      allow delete: if isAdmin();

      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow delete: if request.auth.uid == resource.data.author_uid || isAdmin();
      }

      match /reactions/{userId} {
        allow read: if request.auth != null;
        allow write, delete: if request.auth.uid == userId;
      }
    }
    
    match /notifications/{notificationId} {
        allow read: if request.auth != null;
        allow create, update, delete: if isAdmin();
    }
  }
}`}
                                </code></pre>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-red-500">Passo 5 (Crítico):</strong> Configurar Regras do Storage</h3>
                                <p className="mb-2">
                                    Para garantir que os uploads de fotos funcionem corretamente, vá para <strong>Storage</strong>, na aba <strong>Regras</strong>, e substitua o conteúdo pelo código abaixo:
                                </p>
                                <pre className="bg-gray-800 text-white p-4 rounded-lg text-xs overflow-x-auto"><code>
{`rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /posts/{imageName} {
      allow read: if true;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/profiles/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}`}
                                </code></pre>
                                 <p className="mt-4">
                                    Após concluir todos os passos, reinicie seu servidor de desenvolvimento para que ele leia o arquivo <code>.env.local</code>.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    if (user.status === 'pending') {
      return (
        <Switch>
          <Route exact path="/" component={PendingApproval} />
          <Redirect to="/" />
        </Switch>
      );
    }
    // User is approved, show the main application
    return (
      <MainLayout>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/virtual-id" component={VirtualIdCard} />
          <Route path="/edit-profile" component={EditProfile} />
          <Route path="/my-course" component={MyCourse} />
          <Route path="/financial" component={Financial} />
          <Route path="/help" component={Help} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/class-schedule" component={ClassSchedule} />
          {user.isAdmin && (
            <>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/edit-user/:uid" component={AdminEditUser} />
            </>
          )}
          <Route path="/validate-id/:data" component={ValidateIdCard} />
          <Redirect to="/" />
        </Switch>
      </MainLayout>
    );
  }

  // No user, show public routes
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/validate-id/:data" component={ValidateIdCard} />
      <Redirect to="/login" />
    </Switch>
  );
};


const App: React.FC = () => {
    const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!isFirebaseConfigured && !isProduction) {
        return <FirebaseConfigWarning />;
    }

    return (
        <AuthProvider>
            <NotificationsProvider>
                <HashRouter>
                    <div className="flex flex-col h-screen max-w-sm mx-auto bg-white shadow-2xl md:max-w-md lg:max-w-lg">
                        <AppRoutes />
                    </div>
                </HashRouter>
            </NotificationsProvider>
        </AuthProvider>
    );
}

export default App;
