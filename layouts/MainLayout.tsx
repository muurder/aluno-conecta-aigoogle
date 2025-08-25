
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';


const Header: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="bg-white p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-3">
                {user?.photo ? (
                    <img src={user.photo} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                )}
                <span className="font-semibold text-gray-700">Olá, {user?.fullName.split(' ')[0] || 'Aluno'} :)</span>
            </div>
            <button onClick={() => navigate('/edit-profile')} className="text-gray-500 hover:text-gray-800">
                <Cog6ToothIcon className="w-7 h-7" />
            </button>
        </header>
    );
}

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const showHeader = location.pathname === '/' || location.pathname === '/home';
  
  return (
    <div className="flex flex-col h-full">
      {showHeader && <Header />}
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
