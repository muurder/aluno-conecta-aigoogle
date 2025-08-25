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

  return (
    // 100dvh + padding-bottom para não ficar escondido pelo nav fixo
    <div
      className="relative min-h-[100dvh] bg-gray-50"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
    >
      {showHeader && (
        <header className="bg-white px-4 pt-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
              {user?.photo ? (
                <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-full h-full text-gray-300" />
              )}
            </div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => navigate('/profile')}>
              <Cog6ToothIcon className="w-7 h-7" />
            </button>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Olá, {user?.fullName?.split(' ').slice(0, 2).join(' ') || 'Aluno'} :)
            </h1>
          </div>
        </header>
      )}

      {/* se quiser rolar só o conteúdo, mantenha overflow aqui */}
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>

      {/* rodapé fixed (fora de qualquer container com overflow/transform) */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
