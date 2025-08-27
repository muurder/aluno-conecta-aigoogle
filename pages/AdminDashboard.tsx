import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, NotificationType } from '../types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CheckCircleIcon as CheckCircleOutline, MagnifyingGlassIcon, ArrowPathIcon, BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import BottomNav from '../components/BottomNav';

type FilterStatus = 'all' | 'pending' | 'approved';

// --- Toast Component ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; show: boolean; onClose: () => void }> = ({ message, type, show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => onClose(), 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
    const Icon = isSuccess ? CheckCircleSolid : ExclamationCircleIcon;

    return (
        <div 
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg shadow-2xl text-white ${bgColor} animate-slide-in`}
            role="alert"
        >
            <Icon className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-semibold">{message}</p>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
            </button>
            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in { animation: slide-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
            `}</style>
        </div>
    );
};


// --- Extracted NotificationModal Component ---
interface NotificationModalProps {
    show: boolean;
    message: string;
    setMessage: (message: string) => void;
    type: NotificationType;
    setType: (type: NotificationType) => void;
    onClose: () => void;
    onSend: () => void;
    isSending: boolean;
}

const NotificationTypeOption: React.FC<{
    value: NotificationType;
    label: string;
    checked: boolean;
    onChange: (value: NotificationType) => void;
    color: string;
}> = ({ value, label, checked, onChange, color }) => (
    <label className="flex-1">
        <input 
            type="radio" 
            name="notificationType" 
            value={value} 
            checked={checked} 
            onChange={() => onChange(value)}
            className="sr-only"
        />
        <div className={`w-full text-center p-2 rounded-md cursor-pointer transition-all duration-200 ${checked ? `${color} text-white font-bold shadow-md` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {label}
        </div>
    </label>
);


const NotificationModal: React.FC<NotificationModalProps> = ({ show, message, setMessage, type, setType, onClose, onSend, isSending }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Enviar Notificação Push</h2>
                <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tipo de Notificação</h3>
                    <div className="flex justify-around gap-2 text-sm">
                        <NotificationTypeOption value="info" label="Info" checked={type === 'info'} onChange={setType} color="bg-blue-500" />
                        <NotificationTypeOption value="warning" label="Aviso" checked={type === 'warning'} onChange={setType} color="bg-yellow-500" />
                        <NotificationTypeOption value="urgent" label="Urgente" checked={type === 'urgent'} onChange={setType} color="bg-red-600" />
                    </div>
                </div>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite a mensagem da notificação..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-y min-h-[100px] focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button 
                        onClick={onSend} 
                        disabled={isSending || !message.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        {isSending ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
                 <button onClick={onClose} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { getAllUsers, deleteUser, updateUser, createNotification } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
    
    // Notification Modal State
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState<NotificationType>('info');
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    
    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });


    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers.filter(u => !u.isAdmin));
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [getAllUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => {
                if (activeFilter === 'pending') return user.status === 'pending';
                if (activeFilter === 'approved') return user.status === 'approved';
                return true;
            })
            .filter(user =>
                user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.institutionalLogin.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [users, searchTerm, activeFilter]);

    const handleApprove = async (user: User) => {
        await updateUser({ ...user, status: 'approved' });
        fetchUsers();
    };

    const handleReprove = async (user: User) => {
        if (window.confirm(`Tem certeza que deseja reprovar (excluir) o usuário ${user.institutionalLogin}? Esta ação não pode ser desfeita.`)) {
            await deleteUser(user.uid);
            fetchUsers();
        }
    };

    const handleSendNotification = async () => {
        if (!notificationMessage.trim()) return;
        setIsSendingNotification(true);
        try {
            await createNotification(notificationMessage, notificationType);
            setToast({ show: true, message: 'Notificação enviada com sucesso!', type: 'success' });
            setNotificationMessage('');
            setNotificationType('info');
            setShowNotificationModal(false);
        } catch (error) {
            console.error("Failed to send notification:", error);
            setToast({ show: true, message: 'Falha ao enviar notificação.', type: 'error' });
        } finally {
            setIsSendingNotification(false);
        }
    };

    const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
        const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
        if (status === 'approved') {
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>Aprovado</span>;
        }
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pendente</span>;
    };
    
    const FilterButton: React.FC<{ filter: FilterStatus; label: string }> = ({ filter, label }) => (
        <button
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
            <NotificationModal 
                show={showNotificationModal}
                message={notificationMessage}
                setMessage={setNotificationMessage}
                type={notificationType}
                setType={setNotificationType}
                onClose={() => setShowNotificationModal(false)}
                onSend={handleSendNotification}
                isSending={isSendingNotification}
            />
            <header className="p-4 bg-white shadow-sm sticky top-0 z-10 border-b">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => navigate('/profile')} className="mr-4 p-1 rounded-full hover:bg-gray-100">
                            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                        </button>
                        <h1 className="font-semibold text-lg text-gray-800">Admin Dashboard</h1>
                    </div>
                    <button onClick={fetchUsers} disabled={loading} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-wait">
                        <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                 <div className="relative mt-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome, email, login..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <FilterButton filter="all" label="Todos" />
                    <FilterButton filter="pending" label="Pendentes" />
                    <FilterButton filter="approved" label="Aprovados" />
                </div>
            </header>

            <main className="flex-grow p-4 overflow-y-auto pb-24">
                 <div className="bg-white p-4 rounded-lg shadow-md border mb-6">
                    <h2 className="text-md font-bold text-gray-700 mb-3">Funções de Admin</h2>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => setShowNotificationModal(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                            <BellAlertIcon className="w-5 h-5" />
                            <span>Enviar Notificação Push</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500 mt-8">Carregando usuários...</p>
                ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8">
                        {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário para gerenciar.'}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredUsers.map(user => (
                            <div key={user.uid} className="bg-white p-4 rounded-lg shadow-md border flex flex-col">
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`} 
                                        alt={user.fullName} 
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold text-gray-800 truncate">{user.fullName}</h2>
                                        <p className="text-sm text-gray-500 truncate">{user.institutionalLogin}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        <div className="mt-2">
                                            <StatusBadge status={user.status} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-gray-100">
                                    {user.status === 'pending' && (
                                        <button onClick={() => handleApprove(user)} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Aprovar">
                                            <CheckCircleOutline className="w-6 h-6" />
                                        </button>
                                    )}
                                    <button onClick={() => navigate(`/admin/edit-user/${user.uid}`)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Editar">
                                        <PencilIcon className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => handleReprove(user)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Reprovar/Excluir">
                                        <TrashIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default AdminDashboard;