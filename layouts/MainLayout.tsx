import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showHeaderOnPages = ['/'];
  const showHeader = showHeaderOnPages.includes(location.pathname);

  // Do not render BottomNav on the Help page
  const showBottomNav = location.pathname !== '/help';

  return (
    <div
      className="relative flex-grow flex flex-col bg-background min-h-screen"
      style={{ paddingBottom: showBottomNav ? 'calc(env(safe-area-inset-bottom) + 64px)' : '0' }}
    >
      {showHeader && (
        <header className="bg-white px-4 pt-6 pb-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200">
              {user?.photo ? (
                <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-full h-full text-slate-300" />
              )}
            </div>
            <button className="text-text-light hover:text-primary" onClick={() => navigate('/profile')}>
              <Cog6ToothIcon className="w-7 h-7" />
            </button>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-text-dark">
              Olá, {user?.fullName?.split(' ').slice(0, 2).join(' ') || 'Aluno'} :)
            </h1>
          </div>
        </header>
      )}

      <main className="flex-grow overflow-y-auto">
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default MainLayout;
