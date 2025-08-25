
import React from 'react';
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom';
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
      <Switch>
        <Route path="/pending" component={PendingApproval} />
        <Redirect to="/pending" />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {!isAuthenticated ? <Login /> : <Redirect to="/" />}
      </Route>
      <Route path="/register">
        {!isAuthenticated ? <Register /> : <Redirect to="/" />}
      </Route>
      
      <Route exact path="/">
        {isAuthenticated ? <MainLayout><Home /></MainLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/profile">
        {isAuthenticated ? <MainLayout><Profile /></MainLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/virtual-id">
        {isAuthenticated ? <VirtualIdCard /> : <Redirect to="/login" />}
      </Route>
      <Route path="/edit-profile">
        {isAuthenticated ? <EditProfile /> : <Redirect to="/login" />}
      </Route>
       <Route path="/my-course">
        {isAuthenticated ? <MainLayout><MyCourse /></MainLayout> : <Redirect to="/login" />}
      </Route>
       <Route path="/financial">
        {isAuthenticated ? <MainLayout><Financial /></MainLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/help">
        {isAuthenticated ? <Help /> : <Redirect to="/login" />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        {isAuthenticated && user?.isAdmin ? <AdminDashboard /> : <Redirect to="/" />}
      </Route>
      <Route path="/admin/edit-user/:login">
        {isAuthenticated && user?.isAdmin ? <AdminEditUser /> : <Redirect to="/" />}
      </Route>
      
      <Redirect to={isAuthenticated ? "/" : "/login"} />
    </Switch>
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