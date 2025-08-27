import React from 'react';
// FIX: Update react-router-dom imports to v6. 'useHistory' is 'useNavigate'.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRightIcon, UserCircleIcon, CameraIcon } from '@heroicons/react/24/solid';
import { IdentificationIcon, UserIcon as UserOutlineIcon, DocumentDuplicateIcon, DocumentTextIcon, QuestionMarkCircleIcon, ArrowLeftOnRectangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  // FIX: Use useNavigate() for navigation in react-router-dom v6.
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    // FIX: Use navigate() for navigation.
    navigate('/login');
  };

  const balao1 = '/decors/balao1.svg';
  const balao2 = '/decors/balao2.svg';

  const ProfileHeader: React.FC = () => (
    <div className="bg-gradient-to-b from-cyan-400 to-teal-500 relative text-white text-center p-6 pt-10 rounded-b-3xl overflow-hidden">
      <img src={balao1} alt="" className="absolute -bottom-10 -left-10 w-32 h-32 opacity-30 transform-gpu" />
      <img src={balao2} alt="" className="absolute -top-12 -right-16 w-48 h-48 opacity-30 transform-gpu" />
      <div className="relative z-10">
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white/50 shadow-lg bg-gray-200">
          {user?.photo ? (
            <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserCircleIcon className="w-full h-full text-gray-400" />
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{user?.fullName}</h1>
        <p className="text-sm opacity-80">{user?.institutionalLogin}</p>
        <button
          onClick={() => navigate('/edit-profile')}
          className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full text-sm transition"
        >
          <CameraIcon className="w-5 h-5" />
          <span>Editar Perfil</span>
        </button>
      </div>
    </div>
  );

  const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="text-gray-500">{icon}</div>
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </button>
  );

  return (
    <div className="flex-grow flex flex-col bg-gray-100">
      <ProfileHeader />
      <main className="p-4 space-y-3">
        {user?.isAdmin && (
          <MenuItem
            icon={<ChartBarIcon className="w-6 h-6" />}
            label="Painel do Administrador"
            onClick={() => navigate('/admin/dashboard')}
          />
        )}
        <MenuItem
          icon={<IdentificationIcon className="w-6 h-6" />}
          label="Carteirinha Virtual"
          onClick={() => navigate('/virtual-id')}
        />
        <MenuItem
          icon={<UserOutlineIcon className="w-6 h-6" />}
          label="Meus Dados Pessoais"
          onClick={() => navigate('/edit-profile')}
        />
        <MenuItem
          icon={<DocumentDuplicateIcon className="w-6 h-6" />}
          label="Meus Documentos"
          onClick={() => { /* No action defined */ }}
        />
        <MenuItem
          icon={<DocumentTextIcon className="w-6 h-6" />}
          label="Contrato de Serviços"
          onClick={() => { /* No action defined */ }}
        />
        <MenuItem
          icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
          label="Ajuda e Suporte"
          onClick={() => navigate('/help')}
        />
      </main>
      <footer className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          Sair da conta
        </button>
      </footer>
    </div>
  );
};

export default Profile;
