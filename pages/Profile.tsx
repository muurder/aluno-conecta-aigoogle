import React, { useState, useMemo } from 'react';
// FIX: Update react-router-dom imports to v5. 'useNavigate' is 'useHistory'.
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRightIcon, UserCircleIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { IdentificationIcon, UserIcon as UserOutlineIcon, DocumentDuplicateIcon, DocumentTextIcon, QuestionMarkCircleIcon, ArrowLeftOnRectangleIcon, ChartBarIcon, EnvelopeIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { UNIVERSITY_DETAILS } from '../constants';

const ContactModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Contato e Contrato</h2>
                <p className="text-gray-600 mb-6 text-sm">Para questões sobre o contrato de serviços, entre em contato por um dos canais abaixo:</p>
                
                <div className="space-y-3">
                    <a href="https://wa.me/5511987697684" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                        <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-green-800">WhatsApp</p>
                            <p className="text-sm text-green-700">(11) 98769-7684</p>
                        </div>
                    </a>
                    <a href="mailto:juannicolas1@gmail.com" className="w-full flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                        <EnvelopeIcon className="w-8 h-8 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-blue-800">Email</p>
                            <p className="text-sm text-blue-700">juannicolas1@gmail.com</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};


const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  // FIX: Use useHistory() for navigation in react-router-dom v5.
  const history = useHistory();
  const [showContactModal, setShowContactModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    // FIX: Use history.push() for navigation.
    history.push('/login');
  };
  
  const { formattedDisplayName, institutionalEmail } = useMemo(() => {
    if (!user) {
      return { formattedDisplayName: 'Aluno', institutionalEmail: '' };
    }

    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
    const nameParts = user.fullName.trim().split(' ').filter(part => part);
    
    let displayName = '';
    if (nameParts.length === 1) {
      displayName = capitalize(nameParts[0]);
    } else if (nameParts.length > 1) {
      displayName = `${capitalize(nameParts[0])} ${capitalize(nameParts[nameParts.length - 1])}`;
    }

    const loginParts = user.fullName.trim().toLowerCase().split(' ').filter(part => part);
    let loginName = '';
    if (loginParts.length === 1) {
      loginName = loginParts[0];
    } else if (loginParts.length > 1) {
      loginName = `${loginParts[0]}.${loginParts[loginParts.length - 1]}`;
    }

    const domain = UNIVERSITY_DETAILS[user.university]?.domain || 'university.edu.br';
    const email = `${loginName}@${domain}`;

    return { formattedDisplayName: displayName, institutionalEmail: email };
  }, [user]);

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
        <h1 className="mt-4 text-2xl font-bold">{formattedDisplayName}</h1>
        <p className="text-sm opacity-80 truncate">{institutionalEmail}</p>
        <button
          onClick={() => history.push('/edit-profile')}
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
      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}
      <ProfileHeader />
      <main className="p-4 space-y-3">
        {user?.isAdmin && (
          <MenuItem
            icon={<ChartBarIcon className="w-6 h-6" />}
            label="Painel do Administrador"
            onClick={() => history.push('/admin/dashboard')}
          />
        )}
        <MenuItem
          icon={<IdentificationIcon className="w-6 h-6" />}
          label="Carteirinha Virtual"
          onClick={() => history.push('/virtual-id')}
        />
        <MenuItem
          icon={<UserOutlineIcon className="w-6 h-6" />}
          label="Meus Dados Pessoais"
          onClick={() => history.push('/edit-profile')}
        />
        <MenuItem
          icon={<DocumentDuplicateIcon className="w-6 h-6" />}
          label="Meus Documentos"
          onClick={() => { /* No action defined */ }}
        />
        <MenuItem
          icon={<DocumentTextIcon className="w-6 h-6" />}
          label="Contrato de Serviços"
          onClick={() => setShowContactModal(true)}
        />
        <MenuItem
          icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
          label="Ajuda e Suporte"
          onClick={() => history.push('/help')}
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
