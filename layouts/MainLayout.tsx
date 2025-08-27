import React from 'react';
// FIX: Update react-router-dom imports to v5. 'useNavigate' is 'useHistory'.
import { useLocation, useHistory } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { BellIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // FIX: Use useHistory() for navigation in react-router-dom v5.
  const history = useHistory();
  const { user } = useAuth();
  const { unreadCount, hasNewNotification } = useNotifications();
  const showHeaderOnPages = ['/'];
  const showHeader = showHeaderOnPages.includes(location.pathname);

  return (
    // 100dvh + padding-bottom para não ficar escondido pelo nav fixo
    <div
      className="relative flex-grow flex flex-col bg-gray-50"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
    >
      <style>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
          20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }
        .animate-ring {
          animation: ring 1.5s ease-in-out;
        }
      `}</style>
      {showHeader && (
        <header className="bg-white px-4 pt-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200" onClick={() => history.push('/profile')}>
              {user?.photo ? (
                <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-full h-full text-gray-300" />
              )}
            </div>
            {/* FIX: Use history.push() for navigation. */}
            <button className="relative text-gray-500 hover:text-gray-700" onClick={() => history.push('/notifications')}>
              <BellIcon className={`w-7 h-7 ${hasNewNotification ? 'animate-ring' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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
