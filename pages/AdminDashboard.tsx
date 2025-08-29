
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { User, NotificationType, Notification } from '../types';
import { 
    ArrowLeftIcon, PencilIcon, TrashIcon, CheckCircleIcon as CheckCircleOutline, 
    MagnifyingGlassIcon, ArrowPathIcon, BellAlertIcon, XMarkIcon, UsersIcon, ClockIcon, BellIcon,
    InformationCircleIcon, ExclamationTriangleIcon, ChevronUpIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import BottomNav from '../components/BottomNav';

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

    // Responsive classes for positioning
    const positionClasses = `
        fixed z-[100] w-11/12 max-w-sm top-4 left-1/2 -translate-x-1/2
        md:w-auto md:max-w-none md:top-auto md:left-auto md:bottom-5 md:right-5 md:translate-x-0
    `;

    return (
        <div 
            className={`${positionClasses} flex items-center gap-4 p-4 rounded-lg shadow-2xl text-white ${bgColor} animate-toast`}
            role="alert"
        >
            <Icon className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-semibold">{message}</p>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
            </button>
            <style>{`
                @keyframes slide-in-top {
                    from { opacity: 0; transform: translate(-50%, -100%); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .animate-toast {
                    animation: slide-in-top 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }

                @media (min-width: 768px) {
                    .animate-toast {
                        animation-name: slide-in-right;
                    }
                }
            `}</style>
        </div>
    );
};


// --- NotificationModal Component ---
interface NotificationModalProps {
    show: boolean; message: string; setMessage: (message: string) => void;
    type: NotificationType; setType: (type: NotificationType) => void;
    onClose: () => void; onSend: () => void; isSending: boolean;
}

const NotificationTypeOption: React.FC<{
    value: NotificationType; label: string; checked: boolean;
    onChange: (value: NotificationType) => void; color: string;
}> = ({ value, label, checked, onChange, color }) => (
    <label className="flex-1">
        <input type="radio" name="notificationType" value={value} checked={checked} onChange={() => onChange(value)} className="sr-only"/>
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
                    value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite a mensagem da notificação..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-y min-h-[100px] focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={onSend} disabled={isSending || !message.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                        {isSending ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
                 <button onClick={onClose} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full"><XMarkIcon className="w-6 h-6"/></button>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {status === 'approved' ? 'Aprovado' : 'Pendente'}
    </span>
);

const UserCard: React.FC<{ user: User; onApprove: () => void; onEdit: () => void; onDelete: () => void; }> = ({ user, onApprove, onEdit, onDelete }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border flex flex-col">
        <div className="flex items-center gap-4">
            <img 
                src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`} 
                alt={user.fullName} 
                className="w-16 h-16 rounded-full object-cover border"
            />
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 truncate">{user.fullName}</h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <div className="mt-2"><StatusBadge status={user.status} /></div>
            </div>
        </div>
        <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-gray-100">
            {user.status === 'pending' && (
                <button onClick={onApprove} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Aprovar usuário">
                    <CheckCircleOutline className="w-6 h-6" />
                </button>
            )}
            <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Editar perfil">
                <PencilIcon className="w-6 h-6" />
            </button>
            <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Excluir usuário">
                <TrashIcon className="w-6 h-6" />
            </button>
        </div>
    </div>
);

// --- UserListModal Component ---
interface UserListModalProps {
    isOpen: boolean; onClose: () => void; title: string; users: User[];
    onApprove: (user: User) => void; onEdit: (uid: string) => void; onDelete: (user: User) => void;
}
const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose, title, users, onApprove, onEdit, onDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b bg-white rounded-t-lg flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">{title} ({users.length})</h2>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto">
                    {users.length > 0 ? (
                        <div className="space-y-4">
                            {users.map(user => (
                                <UserCard 
                                    key={user.uid}
                                    user={user}
                                    onApprove={() => onApprove(user)}
                                    onEdit={() => onEdit(user.uid)}
                                    onDelete={() => onDelete(user)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 mt-8">Nenhum usuário nesta categoria.</p>
                    )}
                </main>
            </div>
        </div>
    );
}

// --- StatCard Component ---
const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: number | string; color: string; onClick?: () => void }> = ({ icon, title, value, color, onClick }) => (
    <button onClick={onClick} className={`w-full p-4 rounded-lg shadow-md flex items-center gap-4 text-white text-left ${color} transition-transform hover:scale-[1.02]`}>
        <div className="p-3 bg-white/20 rounded-full">{icon}</div>
        <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-90">{title}</p>
        </div>
    </button>
);

// --- NotificationHistoryItem Component ---
const NotificationHistoryItem: React.FC<{ notification: Notification; onDelete: (id: string) => void; }> = ({ notification, onDelete }) => {
    const iconMap: Record<NotificationType, React.ReactNode> = {
        info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
        warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />,
        urgent: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
    };

    const formattedDate = new Date(notification.createdAt.seconds * 1000).toLocaleString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-md">
            <div className="flex-shrink-0 mt-1">{iconMap[notification.type]}</div>
            <div className="flex-grow">
                <p className="text-sm text-gray-700">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
            </div>
            <button onClick={() => onDelete(notification.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- CollapsibleSection Component ---
const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className="bg-white rounded-lg shadow-md border">
        <button onClick={onToggle} className="w-full flex justify-between items-center p-4">
            <h2 className="text-lg font-bold text-gray-700">{title}</h2>
            {isOpen ? <ChevronUpIcon className="w-6 h-6 text-gray-500"/> : <ChevronDownIcon className="w-6 h-6 text-gray-500"/>}
        </button>
        {isOpen && <div className="p-4 border-t">{children}</div>}
    </div>
);


type FilterStatus = 'all' | 'pending' | 'approved';
type SectionName = 'overview' | 'adminFunctions' | 'history' | 'userManagement';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { getAllUsers, deleteUser, updateUser, createNotification, deleteNotification } = useAuth();
    const { notifications: allNotifications } = useNotifications();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
    
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState<NotificationType>('info');
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
    
    // State for new features
    const [collapsedSections, setCollapsedSections] = useState({
        overview: true, adminFunctions: true, history: true, userManagement: true
    });
    const [modalData, setModalData] = useState<{ isOpen: boolean; title: string; filterType: FilterStatus | 'total' }>({
        isOpen: false, title: '', filterType: 'total'
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers.filter(u => !u.isAdmin));
        } catch (error) { console.error("Failed to fetch users:", error); } 
        finally { setLoading(false); }
    }, [getAllUsers]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const stats = useMemo(() => ({
        totalUsers: users.length,
        approvedUsers: users.filter(u => u.status === 'approved').length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
        sentNotifications: allNotifications.length,
    }), [users, allNotifications]);

    const filteredUsers = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return users
            .filter(user => {
                if (activeFilter === 'pending') return user.status === 'pending';
                if (activeFilter === 'approved') return user.status === 'approved';
                return true;
            })
            .filter(user =>
                user.fullName.toLowerCase().includes(lowerCaseSearchTerm) ||
                user.email.toLowerCase().includes(lowerCaseSearchTerm) ||
                user.rgm.toLowerCase().includes(lowerCaseSearchTerm)
            );
    }, [users, searchTerm, activeFilter]);
    
    const modalUsers = useMemo(() => {
        if (!modalData.isOpen) return [];
        switch (modalData.filterType) {
            case 'pending': return users.filter(u => u.status === 'pending');
            case 'approved': return users.filter(u => u.status === 'approved');
            default: return users;
        }
    }, [users, modalData.isOpen, modalData.filterType]);


    const handleApprove = async (userToApprove: User) => {
        try {
            await updateUser(userToApprove.uid, { status: 'approved' });
            setToast({ show: true, message: `Usuário ${userToApprove.fullName} aprovado!`, type: 'success' });
            await fetchUsers(); // Refreshes data for both main view and modal
        } catch (error) {
            setToast({ show: true, message: 'Falha ao aprovar o usuário.', type: 'error' });
        }
    };

    const handleReprove = async (user: User) => {
        if (window.confirm(`Tem certeza que deseja reprovar (excluir) o usuário ${user.fullName}?`)) {
            try {
                await deleteUser(user.uid);
                setToast({ show: true, message: 'Usuário excluído com sucesso.', type: 'success' });
                await fetchUsers(); // Refreshes data
            } catch (error) {
                setToast({ show: true, message: 'Falha ao excluir o usuário.', type: 'error' });
            }
        }
    };

    const handleEditUser = (uid: string) => {
        navigate(`/admin/edit-user/${uid}`);
        setModalData({ isOpen: false, title: '', filterType: 'total' }); // Close modal
    };
    
    const handleSendNotification = async () => {
        if (!notificationMessage.trim()) return;
        setIsSendingNotification(true);
        try {
            await createNotification(notificationMessage, notificationType);
            setToast({ show: true, message: 'Notificação enviada!', type: 'success' });
            setShowNotificationModal(false);
            setNotificationMessage('');
            setNotificationType('info');
        } catch (error) {
            setToast({ show: true, message: 'Falha ao enviar notificação.', type: 'error' });
        } finally {
            setIsSendingNotification(false);
        }
    };

    const handleDeleteNotification = async (id: string) => {
        if (window.confirm('Deseja excluir esta notificação do histórico?')) {
            try {
                await deleteNotification(id);
                setToast({ show: true, message: 'Notificação excluída.', type: 'success' });
            } catch (error) {
                setToast({ show: true, message: 'Falha ao excluir.', type: 'error' });
            }
        }
    };
    
    const toggleSection = (section: SectionName) => {
        setCollapsedSections(prev => ({...prev, [section]: !prev[section]}));
    };
    
    const handleCardClick = (filterType: FilterStatus | 'total', title: string) => {
        setModalData({ isOpen: true, title, filterType });
    };

    const FilterButton: React.FC<{ filter: FilterStatus; label: string }> = ({ filter, label }) => (
        <button
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${activeFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
            <NotificationModal 
                show={showNotificationModal} message={notificationMessage} setMessage={setNotificationMessage}
                type={notificationType} setType={setNotificationType} onClose={() => setShowNotificationModal(false)}
                onSend={handleSendNotification} isSending={isSendingNotification}
            />
            <UserListModal 
                isOpen={modalData.isOpen}
                onClose={() => setModalData({ isOpen: false, title: '', filterType: 'total' })}
                title={modalData.title}
                users={modalUsers}
                onApprove={handleApprove}
                onEdit={handleEditUser}
                onDelete={handleReprove}
            />
            <header className="p-4 bg-white shadow-sm sticky top-0 z-10 border-b">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => navigate('/profile')} className="mr-4 p-1 rounded-full hover:bg-gray-100">
                            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                        </button>
                        <h1 className="font-semibold text-lg text-gray-800">Dashboard</h1>
                    </div>
                    <button onClick={fetchUsers} disabled={loading} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-wait">
                        <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <main className="flex-grow p-4 overflow-y-auto pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <CollapsibleSection title="Visão Geral" isOpen={collapsedSections.overview} onToggle={() => toggleSection('overview')}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <StatCard icon={<UsersIcon className="w-6 h-6"/>} title="Total de Usuários" value={stats.totalUsers} color="bg-blue-500" onClick={() => handleCardClick('total', 'Todos os Usuários')} />
                               <StatCard icon={<CheckCircleSolid className="w-6 h-6"/>} title="Usuários Aprovados" value={stats.approvedUsers} color="bg-green-500" onClick={() => handleCardClick('approved', 'Usuários Aprovados')} />
                               <StatCard icon={<ClockIcon className="w-6 h-6"/>} title="Usuários Pendentes" value={stats.pendingUsers} color="bg-yellow-500" onClick={() => handleCardClick('pending', 'Usuários Pendentes')} />
                               <StatCard icon={<BellIcon className="w-6 h-6"/>} title="Notificações Enviadas" value={stats.sentNotifications} color="bg-indigo-500" />
                           </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Funções de Admin" isOpen={collapsedSections.adminFunctions} onToggle={() => toggleSection('adminFunctions')}>
                            <button onClick={() => setShowNotificationModal(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                                <BellAlertIcon className="w-5 h-5" />
                                <span>Enviar Notificação Push</span>
                            </button>
                        </CollapsibleSection>
                        
                        <CollapsibleSection title="Histórico de Notificações" isOpen={collapsedSections.history} onToggle={() => toggleSection('history')}>
                            <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                                {allNotifications.length > 0 ? (
                                    allNotifications.map(n => <NotificationHistoryItem key={n.id} notification={n} onDelete={handleDeleteNotification} />)
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">Nenhuma notificação enviada.</p>
                                )}
                            </div>
                        </CollapsibleSection>
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                         <CollapsibleSection title="Gerenciamento de Usuários" isOpen={collapsedSections.userManagement} onToggle={() => toggleSection('userManagement')}>
                            <div className="relative mb-4">
                                <input
                                    type="text" placeholder="Buscar por nome, email ou RGM..."
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <FilterButton filter="all" label="Todos" />
                                <FilterButton filter="pending" label="Pendentes" />
                                <FilterButton filter="approved" label="Aprovados" />
                            </div>

                            {loading ? (
                                <p className="text-center text-gray-500 mt-8">Carregando usuários...</p>
                            ) : filteredUsers.length === 0 ? (
                                <p className="text-center text-gray-500 mt-8">Nenhum usuário encontrado.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredUsers.map(user => (
                                        <UserCard 
                                            key={user.uid}
                                            user={user}
                                            onApprove={() => handleApprove(user)}
                                            onEdit={() => handleEditUser(user.uid)}
                                            onDelete={() => handleReprove(user)}
                                        />
                                    ))}
                                </div>
                            )}
                        </CollapsibleSection>
                    </div>
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default AdminDashboard;