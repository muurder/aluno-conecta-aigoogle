

import React from 'react';
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

// This component now shows a different warning for production and local development environments.
const FirebaseConfigWarning: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg text-center">
      {isProduction ? (
        <>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro de Configuração</h2>
          <p className="text-gray-700 mb-4">
            O aplicativo não pôde ser iniciado devido a um problema de configuração no servidor.
          </p>
          <p className="text-gray-600">
            Por favor, entre em contato com o administrador do sistema para resolver o problema.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Atenção: Configuração Local Incompleta</h2>
          <p className="text-gray-700 mb-4">
            Para rodar o "Portal do Aluno" no seu computador, você precisa das chaves de API.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            (Isso é diferente das chaves que você configurou na Vercel, que são para o site online).
          </p>
          
          <p className="text-gray-700 mb-2 font-semibold">Como resolver:</p>
          <ol className="text-left list-decimal list-inside text-gray-700 mb-6 space-y-1">
              <li>Crie um arquivo chamado <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">.env.local</code> na raiz do projeto.</li>
              <li>Copie e cole o texto abaixo nele, substituindo pelas suas chaves.</li>
          </ol>

          <div className="text-left bg-gray-100 p-4 rounded-md overflow-x-auto">
            <pre className="text-xs text-gray-600">
              <code>
{`# .env.local
# Cole suas chaves do Firebase e Gemini aqui

VITE_FIREBASE_API_KEY="SUA_API_KEY_DO_FIREBASE"
VITE_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN_DO_FIREBASE"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID_DO_FIREBASE"
VITE_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET_DO_FIREBASE"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID_DO_FIREBASE"
VITE_FIREBASE_APP_ID="SEU_APP_ID_DO_FIREBASE"
VITE_GEMINI_API_KEY="SUA_CHAVE_DE_API_DO_GEMINI"`}
              </code>
            </pre>
          </div>
           <p className="text-xs text-gray-500 mt-4">Este arquivo <code className="text-xs">.env.local</code> é seguro e não será enviado para o GitHub.</p>
        </>
      )}
    </div>
  </div>
);


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
      <Route path="/help" element={isAuthenticated ? <Help /> : <Navigate to="/login" />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={isAuthenticated && user?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
      <Route path="/admin/edit-user/:uid" element={isAuthenticated && user?.isAdmin ? <AdminEditUser /> : <Navigate to="/" />} />
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
};

const App: React.FC = () => {
  // Checks if the environment variable for Firebase is set.
  const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_API_KEY;

  if (!isFirebaseConfigured) {
    return <FirebaseConfigWarning />;
  }
  
  return (
    <AuthProvider>
      <div className="min-h-[100dvh] font-sans bg-slate-100">
        <div className="relative max-w-sm mx-auto min-h-[100dvh] bg-white shadow-lg overflow-hidden">
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;