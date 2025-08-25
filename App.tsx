
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
import { firebaseConfig } from './firebase';

const FirebaseConfigWarning: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Atenção: Configuração do Firebase Incompleta</h2>
      <p className="text-gray-700 mb-2">
        Para que o aplicativo funcione, você precisa conectar suas credenciais do Firebase.
      </p>
      <p className="text-gray-700 mb-6">
        1. Renomeie o arquivo <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">firebase.example.ts</code> para <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">firebase.ts</code>.
        <br />
        2. Substitua os valores de exemplo pelas suas chaves do Firebase.
      </p>
      <div className="text-left bg-gray-100 p-4 rounded-md overflow-x-auto">
        <pre className="text-xs text-gray-600">
          <code>
{`// firebase.ts

export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  // ... e os outros campos
};`}
          </code>
        </pre>
      </div>
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
  const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "COLOQUE_SUA_API_KEY_AQUI";

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
