
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

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

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
      <Route path="/admin/edit-user/:login" element={isAuthenticated && user?.isAdmin ? <AdminEditUser /> : <Navigate to="/" />} />
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="h-screen font-sans">
        <div className="relative max-w-sm mx-auto h-full bg-white shadow-lg">
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
