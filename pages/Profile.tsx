
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRightIcon, UserCircleIcon, CameraIcon } from '@heroicons/react/24/solid';
import { IdentificationIcon, UserIcon as UserOutlineIcon, DocumentDuplicateIcon, DocumentTextIcon, QuestionMarkCircleIcon, ArrowLeftOnRectangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ProfileHeader: React.FC = () => (
    <div className="bg-gradient-to-b from-teal-400 to-cyan-500 p-6 text-white text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative">
            <div className="relative w-28 h-28 mx-auto">
                {user?.photo ? (
                    <img src={user.photo} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white/80 shadow-lg" />
                ) : (
                    <UserCircleIcon className="w-28 h-28 text-white/70" />
                )}
                <button onClick={() => navigate('/edit-profile')} className="absolute bottom-0 right-0 bg-white text-blue-600 rounded-full p-2 shadow-md">
                    <CameraIcon className="w-5 h-5" />
                </button>
            </div>
            <h2 className="mt-4 text-xl font-bold">{user?.fullName}</h2>
            <p className="text-sm opacity-90">{user?.email}</p>
        </div>
    </div>
  );

  const ProfileLink: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full p-4 border-b border-gray-200 hover:bg-gray-50">
        <div className="flex items-center space-x-4">
            {icon}
            <span className="text-gray-700">{label}</span>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
        <ProfileHeader />
        
        <div className="p-4">
            <button onClick={() => navigate('/edit-profile')} className="w-full text-left bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between mb-6">
                <div>
                    <p className="font-semibold text-blue-800">{user?.course}</p>
                    <p className="text-sm text-gray-500">RGM {user?.rgm}</p>
                </div>
                 <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>
        </div>

        <div className="flex-grow bg-white">
            <h3 className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase">Sua Conta</h3>
            {user?.isAdmin && (
                <ProfileLink icon={<ChartBarIcon className="w-6 h-6 text-gray-500"/>} label="Dashboard" onClick={() => navigate('/admin/dashboard')} />
            )}
            <ProfileLink icon={<IdentificationIcon className="w-6 h-6 text-gray-500"/>} label="Carteirinha virtual" onClick={() => navigate('/virtual-id')} />
            <ProfileLink icon={<UserOutlineIcon className="w-6 h-6 text-gray-500"/>} label="Informações pessoais" onClick={() => navigate('/edit-profile')} />
            <ProfileLink icon={<DocumentDuplicateIcon className="w-6 h-6 text-gray-500"/>} label="Meus documentos" onClick={() => {}} />
            <ProfileLink icon={<DocumentTextIcon className="w-6 h-6 text-gray-500"/>} label="Emitir documentos" onClick={() => {}} />
            <ProfileLink icon={<QuestionMarkCircleIcon className="w-6 h-6 text-gray-500"/>} label="Ajuda" onClick={() => navigate('/help')} />
        </div>

        <div className="bg-white p-4">
             <ProfileLink icon={<ArrowLeftOnRectangleIcon className="w-6 h-6 text-red-500"/>} label="Sair do app" onClick={handleLogout} />
        </div>
    </div>
  );
};

export default Profile;
