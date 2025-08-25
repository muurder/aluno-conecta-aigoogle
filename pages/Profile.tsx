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
    <div className="bg-gradient-to-b from-cyan-300 to-teal-400 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-8 left-10 w-20 h-20">
            <img src="https://i.imgur.com/8qk842Z.png" alt="deco" className="opacity-50" />
        </div>
        <div className="absolute top-16 right-10 w-16 h-16">
            <img src="https://i.imgur.com/kH1V5Am.png" alt="deco" className="opacity-50" />
        </div>
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
            <h2 className="mt-4 text-xl font-bold text-gray-800">{user?.fullName}</h2>
            <p className="text-sm text-gray-700">{user?.email}</p>
        </div>
    </div>
  );

  const ProfileLink: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isLogout?: boolean }> = ({ icon, label, onClick, isLogout = false }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-4">
            <div className={isLogout ? 'text-red-500' : 'text-gray-500'}>{icon}</div>
            <span className={isLogout ? 'text-red-500 font-medium' : 'text-gray-700'}>{label}</span>
        </div>
        {!isLogout && <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
        <ProfileHeader />
        
        <div className="p-4 -mt-8 relative z-10">
            <button onClick={() => navigate('/my-course')} className="w-full text-left bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="font-semibold text-blue-800">{user?.course}</p>
                    <p className="text-sm text-gray-500">RGM {user?.rgm}</p>
                </div>
                 <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>
        </div>

        <div className="flex-grow bg-white mx-4 mb-4 rounded-lg shadow-md overflow-hidden">
            <h3 className="px-4 py-3 text-sm font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">Sua Conta</h3>
            <div className="flex flex-col">
                {user?.isAdmin && (
                    <ProfileLink icon={<ChartBarIcon className="w-6 h-6"/>} label="Dashboard" onClick={() => navigate('/admin/dashboard')} />
                )}
                <ProfileLink icon={<IdentificationIcon className="w-6 h-6"/>} label="Carteirinha virtual" onClick={() => navigate('/virtual-id')} />
                <ProfileLink icon={<UserOutlineIcon className="w-6 h-6"/>} label="Informações pessoais" onClick={() => navigate('/edit-profile')} />
                <ProfileLink icon={<DocumentDuplicateIcon className="w-6 h-6"/>} label="Meus documentos" onClick={() => {}} />
                <ProfileLink icon={<DocumentTextIcon className="w-6 h-6"/>} label="Emitir documentos" onClick={() => {}} />
                <ProfileLink icon={<QuestionMarkCircleIcon className="w-6 h-6"/>} label="Ajuda" onClick={() => navigate('/help')} />
            </div>
        </div>

        <div className="bg-white mx-4 mb-4 rounded-lg shadow-md">
             <ProfileLink icon={<ArrowLeftOnRectangleIcon className="w-6 h-6"/>} label="Sair do app" onClick={handleLogout} isLogout={true} />
        </div>
    </div>
  );
};

export default Profile;