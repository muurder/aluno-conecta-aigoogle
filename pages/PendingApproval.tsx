
import React, { useEffect } from 'react';
// FIX: Update react-router-dom imports to v6. 'useHistory' is 'useNavigate'.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClockIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const PendingApproval: React.FC = () => {
  // FIX: Use useNavigate() for navigation in react-router-dom v6.
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // A lógica de redirecionamento agora é tratada centralmente no App.tsx
    // com base no estado do usuário fornecido pelo AuthContext.
    // Se o status do usuário mudar para 'approved', o App.tsx irá redirecionar
    // automaticamente para a página inicial.
  }, [user]);

  const handleLogout = async () => {
    await logout();
    // FIX: Use navigate() for navigation.
    navigate('/login');
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
        <ClockIcon className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-800">Aguardando aprovação do administrador</h1>
        <p className="text-gray-600">
          Usuário: <span className="font-semibold text-gray-900">{user?.email}</span>
        </p>
        <p className="text-sm text-gray-500">
          Sua conta foi criada com sucesso e está aguardando aprovação. Você será redirecionado automaticamente assim que for aprovado.
        </p>
        
        <button
          onClick={handleLogout}
          className="w-full bg-gray-200 text-gray-700 font-bold p-3 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
        >
          <ArrowUturnLeftIcon className="h-5 w-5"/>
          Voltar ao Login
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
