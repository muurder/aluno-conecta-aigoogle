
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRightIcon, UserCircleIcon, CameraIcon } from '@heroicons/react/24/solid';
import { IdentificationIcon, UserIcon as UserOutlineIcon, DocumentDuplicateIcon, DocumentTextIcon, QuestionMarkCircleIcon, ArrowLeftOnRectangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const ProfileHeader: React.FC = () => (
    <div className="bg-gradient-to-b from-cyan-200 to-teal-300 p-6 text-center relative overflow-hidden">
        <img src="/images/balao1.png" className="absolute top-8 left-8 w-20 h-auto opacity-80 pointer-events-none" alt="Decorative chat bubble" />
        <img src="/images/balao2.png" className="absolute top-12 right-12 w-16 h-auto opacity-80 pointer-events-none" alt="Decorative chat bubble" />
        <div className="relative">
            <div className="relative w-28 h-28 mx-auto">
                {user?.photo ? (
                    <img src={user.photo} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white/80 shadow-lg" />
                ) : (
                    <UserCircleIcon className="w-28 h-28 text-white/70" />
                )}
                <button onClick={() => history.push('/edit-profile')} className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-md hover:bg-blue-700 transition">
                    <CameraIcon className="w-5 h-5" />
                </button>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-800">{user?.fullName}</h2>
            <p className="text-sm text-gray-700 break-words">{user?.email}</p>
        </div>
    </div>
  );

  const ProfileLink: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isLogout?: boolean }> = ({ icon, label, onClick, isLogout = false }) => (
    <button onClick={onClick} className="flex items-center w-full p-4 text-left hover:bg-gray-100 rounded-lg transition-colors">
        <div className="flex items-center space-x-4">
            <div className={isLogout ? 'text-red-500' : 'text-gray-500'}>{icon}</div>
            <span className={`font-medium ${isLogout ? 'text-red-500' : 'text-gray-700'}`}>{label}</span>
        </div>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white">
        <ProfileHeader />
        
        <div className="p-4 -mt-10 relative z-10">
            <button onClick={() => history.push('/my-course')} className="w-full text-left bg-white p-4 rounded-lg shadow-md border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition">
                <span className="font-semibold text-gray-800">{user?.course}</span>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>RGM {user?.rgm}</span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
            </button>
        </div>

        <div className="px-4 pb-4 flex-grow">
            <h3 className="px-2 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sua Conta</h3>
            <div className="flex flex-col">
                {user?.isAdmin && (
                    <ProfileLink icon={<ChartBarIcon className="w-6 h-6"/>} label="Dashboard" onClick={() => history.push('/admin/dashboard')} />
                )}
                <ProfileLink icon={<IdentificationIcon className="w-6 h-6"/>} label="Carteirinha virtual" onClick={() => history.push('/virtual-id')} />
                <ProfileLink icon={<UserOutlineIcon className="w-6 h-6"/>} label="Informações pessoais" onClick={() => history.push('/edit-profile')} />
                <ProfileLink icon={<DocumentDuplicateIcon className="w-6 h-6"/>} label="Meus documentos" onClick={() => {}} />
                <ProfileLink icon={<DocumentTextIcon className="w-6 h-6"/>} label="Emitir documentos" onClick={() => {}} />
                <ProfileLink icon={<QuestionMarkCircleIcon className="w-6 h-6"/>} label="Ajuda" onClick={() => history.push('/help')} />
                <ProfileLink icon={<ArrowLeftOnRectangleIcon className="w-6 h-6"/>} label="Sair do app" onClick={handleLogout} isLogout={true} />
            </div>
        </div>
    </div>
  );
};

export default Profile;