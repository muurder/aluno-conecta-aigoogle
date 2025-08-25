
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
    <div className="flex flex-col h-full bg-gray-100">
      {showHeader && (
        <header className="bg-white px-4 pt-6 pb-4 shadow-sm">
            <div className="flex justify-between items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    {user?.photo ? (
                        <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-full h-full text-gray-400" />
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
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
