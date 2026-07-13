
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { User, NotificationType, Notification } from '../types';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
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

    // Bulletproof top-centered toast styling on mobile (uses margins/left/right, no translate-x centering needed to prevent clipping)
    const positionClasses = `
        fixed z-[100] left-4 right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] mx-auto max-w-md
        md:left-auto md:right-5 md:bottom-5 md:top-auto md:w-auto md:max-w-sm
    `;

    return (
        <div 
            className={`${positionClasses} flex items-center gap-4 p-4 rounded-lg shadow-2xl text-white ${bgColor} animate-toast`}
            role="alert"
        >
            <Icon className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-semibold flex-1 min-w-0 break-words">{message}</p>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
            </button>
            <style>{`
                @keyframes slide-in-top {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .animate-toast {
                    animation: slide-in-top 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status === 'approved' ? 'bg-green-150 text-green-800' : 'bg-yellow-150 text-yellow-800'}`}>
        {status === 'approved' ? 'Aprovado' : 'Pendente'}
    </span>
);

const UserCard: React.FC<{ user: User; onApprove: () => void; onEdit: () => void; onDelete: () => void; onManagePermissions: () => void; }> = ({ user, onApprove, onEdit, onDelete, onManagePermissions }) => {
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'Nunca acessou';
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Não cadastrada';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const genderLabels: Record<string, string> = {
        masculino: 'Masculino',
        feminino: 'Feminino',
        outro: 'Outro'
    };

    const genderColors: Record<string, string> = {
        masculino: 'bg-blue-50 text-blue-700 border-blue-100',
        feminino: 'bg-pink-50 text-pink-700 border-pink-100',
        outro: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
                <img 
                    src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`} 
                    alt={user.fullName} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-base truncate">{user.fullName}</h3>
                        <StatusBadge status={user.status} />
                        {user.isAdmin && (
                            <span className="px-2.5 py-0.5 text-[10px] font-bold border rounded-full bg-purple-50 text-purple-700 border-purple-100 uppercase tracking-wider">
                                Admin
                            </span>
                        )}
                        {user.gender && (
                            <span className={`px-2.5 py-0.5 text-[10px] font-semibold border rounded-full ${genderColors[user.gender] || genderColors.outro}`}>
                                {genderLabels[user.gender] || 'Outro'}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">RGM: <span className="font-semibold text-gray-600">{user.rgm || 'Sem RGM'}</span> | Curso: <span className="font-semibold text-gray-600">{user.course || 'Não informado'}</span></p>
                    
                    {user.isAdmin && user.adminPermissions && (
                        <div className="text-[10px] text-gray-400 mt-1 text-left bg-purple-50/30 px-2 py-1 rounded-md inline-block">
                            <span className="font-bold text-purple-700">Privilégios:</span>{' '}
                            {[
                                user.adminPermissions.approveUsers !== false && 'Aprovar Usuários',
                                user.adminPermissions.manageUniversities !== false && 'Gerenciar Faculdades',
                                user.adminPermissions.sendNotifications !== false && 'Notificações',
                                user.adminPermissions.deleteUsers !== false && 'Excluir Usuários',
                            ].filter(Boolean).join(', ') || 'Nenhum'}
                        </div>
                    )}
                </div>
            </div>

            {/* Extra Analytics Details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-3.5 border-t border-gray-100 text-[11px] text-gray-500">
                <div>
                    <span className="text-gray-400 font-light">Último Acesso:</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{formatDateTime(user.lastAccess)}</p>
                </div>
                <div>
                    <span className="text-gray-400 font-light">Total de Acessos:</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{user.accessCount ?? 0} { (user.accessCount ?? 0) === 1 ? 'acesso' : 'acessos' }</p>
                </div>
                <div>
                    <span className="text-gray-400 font-light">Data de Cadastro:</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                    <span className="text-gray-400 font-light">Nascimento:</span>
                    <p className="font-semibold text-gray-700 mt-0.5">
                        {user.birthDate ? new Date(user.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100 flex-wrap gap-y-2">
                {user.status === 'pending' && (
                    <button onClick={onApprove} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-150 border border-green-200 rounded-lg transition-colors" title="Aprovar usuário">
                        <CheckCircleOutline className="w-4 h-4" />
                        <span>Aprovar</span>
                    </button>
                )}
                <button onClick={onManagePermissions} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-105 border border-purple-200 rounded-lg transition-colors" title="Gerenciar Permissões">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span>Permissões</span>
                </button>
                <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-105 border border-blue-200 rounded-lg transition-colors" title="Editar perfil">
                    <PencilIcon className="w-4 h-4" />
                    <span>Editar</span>
                </button>
                <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-105 border border-red-200 rounded-lg transition-colors" title="Excluir usuário">
                    <TrashIcon className="w-4 h-4" />
                    <span>Excluir</span>
                </button>
            </div>
        </div>
    );
};

// --- UserListModal Component ---
interface UserListModalProps {
    isOpen: boolean; onClose: () => void; title: string; users: User[];
    onApprove: (user: User) => void; onEdit: (uid: string) => void; onDelete: (user: User) => void;
    onManagePermissions: (user: User) => void;
}

const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose, title, users, onApprove, onEdit, onDelete, onManagePermissions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<string>('newest');
    const [genderFilter, setGenderFilter] = useState<string>('all');

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSortOption('newest');
            setGenderFilter('all');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const safeGetTime = (dateValue: any, fallback: number = 0): number => {
        if (!dateValue) return fallback;
        if (typeof dateValue === 'object' && dateValue.seconds !== undefined) {
            return dateValue.seconds * 1000;
        }
        if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
            return dateValue.toDate().getTime();
        }
        const parsed = new Date(dateValue).getTime();
        return isNaN(parsed) ? fallback : parsed;
    };

    const processedUsers = [...users]
        .filter(user => {
            const term = searchTerm.toLowerCase();
            return (
                user.fullName?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.rgm?.includes(term)
            );
        })
        .filter(user => {
            if (genderFilter === 'all') return true;
            return user.gender === genderFilter;
        })
        .sort((a, b) => {
            switch (sortOption) {
                case 'az':
                    return (a.fullName || '').localeCompare(b.fullName || '');
                case 'za':
                    return (b.fullName || '').localeCompare(a.fullName || '');
                case 'newest':
                    return safeGetTime(b.createdAt, 0) - safeGetTime(a.createdAt, 0);
                case 'oldest':
                    return safeGetTime(a.createdAt, Infinity) - safeGetTime(b.createdAt, Infinity);
                case 'recentAccess':
                    return safeGetTime(b.lastAccess, 0) - safeGetTime(a.lastAccess, 0);
                case 'oldAccess':
                    return safeGetTime(a.lastAccess, Infinity) - safeGetTime(b.lastAccess, Infinity);
                case 'mostActive':
                    return (b.accessCount || 0) - (a.accessCount || 0);
                case 'leastActive':
                    return (a.accessCount || 0) - (b.accessCount || 0);
                default:
                    return 0;
            }
        });

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Exibindo {processedUsers.length} de {users.length} usuários</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Search, Sort and Gender Filters Dashboard */}
                <div className="bg-white px-4 py-3 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar nesta lista..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2.5 pl-9 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    {/* Sorting */}
                    <div>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                        >
                            <option value="newest">Últimos Cadastrados</option>
                            <option value="oldest">Primeiros Cadastrados</option>
                            <option value="az">Nome (A - Z)</option>
                            <option value="za">Nome (Z - A)</option>
                            <option value="recentAccess">Último Acesso (Recente)</option>
                            <option value="oldAccess">Último Acesso (Antigo)</option>
                            <option value="mostActive">Mais Ativos (Acessos)</option>
                            <option value="leastActive">Inativos / Menos Ativos</option>
                        </select>
                    </div>

                    {/* Gender */}
                    <div>
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                        >
                            <option value="all">Todos os Gêneros</option>
                            <option value="masculino">Masculino</option>
                            <option value="feminino">Feminino</option>
                            <option value="outro">Outro / Não informado</option>
                        </select>
                    </div>
                </div>

                <main className="flex-grow p-4 overflow-y-auto">
                    {processedUsers.length > 0 ? (
                        <div className="space-y-4">
                            {processedUsers.map(user => (
                                <UserCard 
                                    key={user.uid}
                                    user={user}
                                    onApprove={() => onApprove(user)}
                                    onEdit={() => onEdit(user.uid)}
                                    onDelete={() => onDelete(user)}
                                    onManagePermissions={() => onManagePermissions(user)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-semibold">Nenhum estudante atende aos filtros</p>
                            <p className="text-xs text-gray-400 mt-1">Experimente limpar a busca ou alterar as opções de filtragem.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

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

    const formattedDate = notification.createdAt
        ? new Date(notification.createdAt.seconds * 1000).toLocaleString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        : 'Enviando...';

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
const CollapsibleSection: React.FC<{ title: string | React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <button onClick={onToggle} className="w-full flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
            {typeof title === 'string' ? <h2 className="text-lg font-bold text-gray-700 text-left">{title}</h2> : title}
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-550 shrink-0"/> : <ChevronDownIcon className="w-5 h-5 text-gray-550 shrink-0"/>}
        </button>
        {isOpen && <div className="p-4 border-t border-slate-200/60 bg-white">{children}</div>}
    </div>
);


type FilterStatus = 'all' | 'pending' | 'approved';
type SectionName = 'overview' | 'adminFunctions' | 'history' | 'userManagement' | 'universityManagement' | 'support';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { getAllUsers, deleteUser, updateUser, createNotification, deleteNotification, universities, addUniversity, updateUniversity, deleteUniversity } = useAuth();
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
    const [apkVisibility, setApkVisibility] = useState<'all' | 'android' | 'ios' | 'none'>('all');

    // Current Admin Capabilities
    const { user: currentAdmin } = useAuth();
    const canApproveUsers = currentAdmin?.isAdmin && (currentAdmin?.adminPermissions?.approveUsers !== false);
    const canManageUniversities = currentAdmin?.isAdmin && (currentAdmin?.adminPermissions?.manageUniversities !== false);
    const canSendNotifications = currentAdmin?.isAdmin && (currentAdmin?.adminPermissions?.sendNotifications !== false);
    const canDeleteUsers = currentAdmin?.isAdmin && (currentAdmin?.adminPermissions?.deleteUsers !== false);

    // University Management States with localStorage
    const [showUniModal, setShowUniModal] = useState(false);
    const [uniModalMode, setUniModalMode] = useState<'add' | 'edit'>('add');
    const [editingUniName, setEditingUniName] = useState('');
    const [uniName, setUniName] = useState('');
    const [uniDomain, setUniDomain] = useState('');
    const [uniCity, setUniCity] = useState('');
    const [uniState, setUniState] = useState('');
    const [uniCampuses, setUniCampuses] = useState('');
    const [uniLogoFile, setUniLogoFile] = useState<File | null>(null);
    const [uniLogoUrl, setUniLogoUrl] = useState('');
    const [savingUni, setSavingUni] = useState(false);
    const [uniError, setUniError] = useState('');

    const [uniSearch, setUniSearch] = useState(() => localStorage.getItem('uni_mgmt_search') || '');
    const [uniSort, setUniSort] = useState<'asc' | 'desc'>(() => (localStorage.getItem('uni_mgmt_sort') as 'asc' | 'desc') || 'asc');
    const [uniView, setUniView] = useState<'list' | 'cards'>(() => (localStorage.getItem('uni_mgmt_view') as 'list' | 'cards') || 'cards');

    useEffect(() => {
        localStorage.setItem('uni_mgmt_search', uniSearch);
    }, [uniSearch]);

    useEffect(() => {
        localStorage.setItem('uni_mgmt_sort', uniSort);
    }, [uniSort]);

    useEffect(() => {
        localStorage.setItem('uni_mgmt_view', uniView);
    }, [uniView]);

    const filteredAndSortedUnis = useMemo(() => {
        let result = [...universities];
        if (uniSearch.trim()) {
            const query = uniSearch.toLowerCase();
            result = result.filter(u =>
                u.name.toLowerCase().includes(query) ||
                (u.domain && u.domain.toLowerCase().includes(query)) ||
                (u.city && u.city.toLowerCase().includes(query)) ||
                (u.state && u.state.toLowerCase().includes(query))
            );
        }
        result.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (uniSort === 'asc') return nameA.localeCompare(nameB);
            return nameB.localeCompare(nameA);
        });
        return result;
    }, [universities, uniSearch, uniSort]);

    // Permissions Wizard States
    const [showPermModal, setShowPermModal] = useState(false);
    const [permUserId, setPermUserId] = useState('');
    const [permUserName, setPermUserName] = useState('');
    const [permStep, setPermStep] = useState(1);
    const [permIsAdmin, setPermIsAdmin] = useState(false);
    const [permApproveUsers, setPermApproveUsers] = useState(false);
    const [permManageUnis, setPermManageUnis] = useState(false);
    const [permSendNotifications, setPermSendNotifications] = useState(false);
    const [permDeleteUsers, setPermDeleteUsers] = useState(false);
    const [savingPerm, setSavingPerm] = useState(false);

    const handleManagePermissions = (u: User) => {
        setPermUserId(u.uid);
        setPermUserName(u.fullName);
        setPermIsAdmin(u.isAdmin || false);
        setPermApproveUsers(u.adminPermissions?.approveUsers !== false);
        setPermManageUnis(u.adminPermissions?.manageUniversities !== false);
        setPermSendNotifications(u.adminPermissions?.sendNotifications !== false);
        setPermDeleteUsers(u.adminPermissions?.deleteUsers !== false);
        setPermStep(1);
        setShowPermModal(true);
    };

    const handleSavePermissions = async () => {
        setSavingPerm(true);
        try {
            await db.collection('profiles').doc(permUserId).update({
                isAdmin: permIsAdmin,
                adminPermissions: {
                    approveUsers: permIsAdmin ? permApproveUsers : false,
                    manageUniversities: permIsAdmin ? permManageUnis : false,
                    sendNotifications: permIsAdmin ? permSendNotifications : false,
                    deleteUsers: permIsAdmin ? permDeleteUsers : false
                }
            });
            setToast({ show: true, message: 'Permissões atualizadas com sucesso!', type: 'success' });
            setShowPermModal(false);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setToast({ show: true, message: `Erro ao salvar permissões: ${err.message || err}`, type: 'error' });
        } finally {
            setSavingPerm(false);
        }
    };

    // Support Chat Panel States
    const [supportChats, setSupportChats] = useState<any[]>([]);
    const [showChatModal, setShowChatModal] = useState(false);
    const [activeChatUserId, setActiveChatUserId] = useState('');
    const [activeChatUserName, setActiveChatUserName] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [adminChatInput, setAdminChatInput] = useState('');
    const [sendingChatMessage, setSendingChatMessage] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = db.collection('support_chats')
            .orderBy('lastMessageTime', 'desc')
            .onSnapshot((snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSupportChats(list);
            }, (error) => {
                console.error("Error fetching support chats:", error);
            });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!activeChatUserId || !showChatModal) return;

        db.collection('support_chats').doc(activeChatUserId).update({
            unreadCountForAdmin: 0
        }).catch(err => console.error("Error resetting unread count:", err));

        const unsub = db.collection('support_chats').doc(activeChatUserId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                const list = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        role: data.role,
                        text: data.text,
                        timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now()
                    };
                });
                setChatMessages(list);
            });
        return () => unsub();
    }, [activeChatUserId, showChatModal]);

    useEffect(() => {
        if (showChatModal) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showChatModal]);

    const handleSendAdminChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminChatInput.trim() || !activeChatUserId) return;

        const messageText = adminChatInput;
        setAdminChatInput('');
        setSendingChatMessage(true);

        try {
            const chatDocRef = db.collection('support_chats').doc(activeChatUserId);
            
            await chatDocRef.collection('messages').add({
                role: 'admin',
                text: messageText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await chatDocRef.set({
                lastMessage: messageText,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                unreadCountForAdmin: 0
            }, { merge: true });

        } catch (err) {
            console.error("Error sending admin chat message:", err);
            setToast({ show: true, message: 'Erro ao enviar mensagem.', type: 'error' });
        } finally {
            setSendingChatMessage(false);
        }
    };

    const handleOpenChat = (chat: any) => {
        setActiveChatUserId(chat.userId);
        setActiveChatUserName(chat.userName);
        setShowChatModal(true);
    };

    const unreadChatsCount = useMemo(() => {
        return supportChats.filter(chat => chat.unreadCountForAdmin > 0).length;
    }, [supportChats]);

    const handleSaveUniversity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uniName.trim() || !uniDomain.trim()) {
            setUniError('Nome e Domínio de e-mail são obrigatórios.');
            return;
        }

        const campusList = uniCampuses.split(',').map(c => c.trim()).filter(c => c.length > 0);
        if (campusList.length === 0) {
            setUniError('A universidade precisa ter pelo menos um campus cadastrado.');
            return;
        }

        setSavingUni(true);
        setUniError('');
        try {
            if (uniModalMode === 'add') {
                await addUniversity(uniName.trim(), uniDomain.trim(), campusList, uniLogoFile || undefined, uniCity.trim(), uniState.trim());
                setToast({ show: true, message: 'Faculdade cadastrada com sucesso!', type: 'success' });
            } else {
                await updateUniversity(editingUniName, uniName.trim(), uniDomain.trim(), campusList, uniLogoFile || undefined, uniLogoUrl, uniCity.trim(), uniState.trim());
                setToast({ show: true, message: 'Faculdade atualizada com sucesso!', type: 'success' });
            }
            setShowUniModal(false);
        } catch (err: any) {
            console.error(err);
            setUniError(`Falha ao salvar: ${err.message || err.code || err}`);
        } finally {
            setSavingUni(false);
        }
    };

    const handleDeleteUniversity = async (name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a faculdade "${name}"?`)) {
            try {
                await deleteUniversity(name);
                setToast({ show: true, message: 'Faculdade excluída com sucesso!', type: 'success' });
            } catch (err: any) {
                console.error(err);
                setToast({ show: true, message: `Falha ao excluir: ${err.message || err.code || err}`, type: 'error' });
            }
        }
    };

    const handleEditUniversity = (uni: any) => {
        setUniModalMode('edit');
        setEditingUniName(uni.name);
        setUniName(uni.name);
        setUniDomain(uni.domain || '');
        setUniCity(uni.city || '');
        setUniState(uni.state || '');
        setUniCampuses(uni.campuses ? uni.campuses.join(', ') : '');
        setUniLogoUrl(uni.logo || '');
        setUniLogoFile(null);
        setUniError('');
        setShowUniModal(true);
    };

    const handleAddUniversityClick = () => {
        setUniModalMode('add');
        setEditingUniName('');
        setUniName('');
        setUniDomain('');
        setUniCity('');
        setUniState('');
        setUniCampuses('');
        setUniLogoUrl('');
        setUniLogoFile(null);
        setUniError('');
        setShowUniModal(true);
    };

    useEffect(() => {
        const unsub = db.collection('configs').doc('app').onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data && typeof data.apkVisibility === 'string') {
                    setApkVisibility(data.apkVisibility as any);
                }
            }
        }, err => {
            console.error("Error loading app config:", err);
        });
        return () => unsub();
    }, []);

    const handleUpdateApkVisibility = async (newValue: 'all' | 'android' | 'ios' | 'none') => {
        try {
            await db.collection('configs').doc('app').set({ apkVisibility: newValue }, { merge: true });
            const labels = {
                all: 'ativado para todos os usuários',
                android: 'visível apenas no Android',
                ios: 'visível apenas no iOS',
                none: 'ocultado para todos'
            };
            setToast({ show: true, message: `Download do APK ${labels[newValue]}!`, type: 'success' });
        } catch (error) {
            console.error("Error updating APK download visibility:", error);
            setToast({ show: true, message: 'Falha ao atualizar visibilidade do APK.', type: 'error' });
        }
    };
    
    // State for collapsed sections, initialized from localStorage if available
    const [collapsedSections, setCollapsedSections] = useState(() => {
        try {
            const saved = localStorage.getItem('admin_dashboard_collapsed');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.universityManagement === undefined) {
                    parsed.universityManagement = true;
                }
                if (parsed && parsed.support === undefined) {
                    parsed.support = true;
                }
                return parsed;
            }
        } catch (e) {
            console.warn("Could not load collapsed sections state from localStorage", e);
        }
        return {
            overview: true,
            adminFunctions: true,
            history: true,
            userManagement: true,
            universityManagement: true,
            support: true
        };
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
                user.rgm.includes(lowerCaseSearchTerm)
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
        setCollapsedSections(prev => {
            const updated = { ...prev, [section]: !prev[section] };
            try {
                localStorage.setItem('admin_dashboard_collapsed', JSON.stringify(updated));
            } catch (e) {
                console.warn("Could not save collapsed sections state to localStorage", e);
            }
            return updated;
        });
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
        <div className="flex flex-col bg-gray-100 min-h-[100dvh]">
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
                onManagePermissions={handleManagePermissions}
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
                            <div className="space-y-4">
                                {canSendNotifications ? (
                                    <button onClick={() => setShowNotificationModal(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                                        <BellAlertIcon className="w-5 h-5" />
                                        <span>Enviar Notificação Push</span>
                                    </button>
                                ) : (
                                    <p className="text-xs text-gray-500 text-center py-4 font-semibold uppercase tracking-wider">Permissão Necessária: Enviar Notificações</p>
                                )}
                            </div>
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
                                            onManagePermissions={() => handleManagePermissions(user)}
                                        />
                                    ))}
                                </div>
                            )}
                        </CollapsibleSection>

                        <CollapsibleSection title="Gerenciamento de Universidades" isOpen={collapsedSections.universityManagement} onToggle={() => toggleSection('universityManagement')}>
                            <div className="flex flex-col gap-3 mb-4">
                                <div className="flex justify-between items-center text-left">
                                    <span className="text-xs text-gray-500 font-semibold">Total: {filteredAndSortedUnis.length} cadastradas</span>
                                    {canManageUniversities && (
                                        <button 
                                            onClick={handleAddUniversityClick}
                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition uppercase tracking-wider"
                                        >
                                            + Nova Faculdade
                                        </button>
                                    )}
                                </div>
                                
                                {/* Search, Sort and View Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Buscar faculdade..."
                                            value={uniSearch}
                                            onChange={(e) => setUniSearch(e.target.value)}
                                            className="w-full p-2 pl-8 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={uniSort}
                                            onChange={(e) => setUniSort(e.target.value as 'asc' | 'desc')}
                                            className="w-full p-2 border border-gray-300 rounded-xl text-xs outline-none bg-white text-gray-700 font-medium"
                                        >
                                            <option value="asc">Ordem: A - Z</option>
                                            <option value="desc">Ordem: Z - A</option>
                                        </select>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-xl gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setUniView('cards')}
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${uniView === 'cards' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            🎴 Cards
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUniView('list')}
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${uniView === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            📋 Lista
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                                {filteredAndSortedUnis.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-6">Nenhuma faculdade encontrada.</p>
                                ) : uniView === 'cards' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {filteredAndSortedUnis.map((uni) => (
                                            <div key={uni.id} className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-250/70 gap-3 relative hover:shadow-sm transition-all duration-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl p-1 flex items-center justify-center shrink-0">
                                                        <img src={uni.logo || '/logos/default.svg'} alt={uni.name} className="max-h-full max-w-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <h4 className="font-bold text-sm text-gray-800 truncate">{uni.name}</h4>
                                                        <div className="text-xs text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                                                            <span>📧 {uni.domain}</span>
                                                        </div>
                                                    </div>
                                                    {canManageUniversities && (
                                                        <div className="flex gap-1 shrink-0">
                                                            <button 
                                                                onClick={() => handleEditUniversity(uni)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                title="Editar dados"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUniversity(uni.name)}
                                                                className="p-1.5 text-red-650 hover:bg-red-50 rounded-lg transition"
                                                                title="Excluir faculdade"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {uni.city && (
                                                    <div className="text-left text-[11px] text-gray-500 -mt-1 font-medium">
                                                        📍 {uni.city} - {uni.state}
                                                    </div>
                                                )}
                                                {uni.campuses && uni.campuses.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200 text-left">
                                                        {uni.campuses.map((campus: string, cIdx: number) => (
                                                            <span key={cIdx} className="bg-white border border-gray-200 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                                                {campus}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* List layout (compact tabular rows) */
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-250 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="p-3">Nome</th>
                                                    <th className="p-3">Domínio</th>
                                                    <th className="p-3">Localização</th>
                                                    <th className="p-3">Campuses</th>
                                                    {canManageUniversities && <th className="p-3 text-right">Ações</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredAndSortedUnis.map((uni) => (
                                                    <tr key={uni.id} className="hover:bg-slate-50/40 transition">
                                                        <td className="p-3 font-semibold text-gray-800">
                                                            <div className="flex items-center gap-2">
                                                                <img src={uni.logo || '/logos/default.svg'} alt={uni.name} className="w-6 h-6 object-contain shrink-0" />
                                                                <span className="truncate max-w-[120px]">{uni.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-gray-550 truncate font-mono">{uni.domain}</td>
                                                        <td className="p-3 text-gray-550">{uni.city ? `${uni.city} - ${uni.state}` : 'N/A'}</td>
                                                        <td className="p-3 text-gray-550 font-semibold">{uni.campuses ? uni.campuses.length : 0}</td>
                                                        {canManageUniversities && (
                                                            <td className="p-3 text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <button 
                                                                        onClick={() => handleEditUniversity(uni)} 
                                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                    >
                                                                        <PencilIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteUniversity(uni.name)} 
                                                                        className="p-1 text-red-650 hover:bg-red-50 rounded"
                                                                    >
                                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection 
                            title={
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-gray-700">Suporte e Mensagens</h2>
                                    {unreadChatsCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                            {unreadChatsCount} novas
                                        </span>
                                    )}
                                </div>
                            } 
                            isOpen={collapsedSections.support} 
                            onToggle={() => toggleSection('support')}
                        >
                            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                                {supportChats.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-6">Nenhuma conversa de suporte iniciada.</p>
                                ) : (
                                    supportChats.map((chat) => {
                                        const unread = chat.unreadCountForAdmin > 0;
                                        const dateStr = chat.lastMessageTime
                                            ? new Date(chat.lastMessageTime.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                            : '';
                                        return (
                                            <div 
                                                key={chat.id} 
                                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${unread ? 'bg-blue-50/40 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100/50'}`}
                                            >
                                                <img 
                                                    src={chat.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.userName)}&background=random`} 
                                                    alt={chat.userName} 
                                                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 shadow-sm"
                                                />
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="flex justify-between items-baseline gap-1">
                                                        <h4 className="font-bold text-sm text-gray-800 truncate">{chat.userName}</h4>
                                                        <span className="text-[10px] text-gray-400 font-medium shrink-0">{dateStr}</span>
                                                    </div>
                                                    <p className={`text-xs truncate mt-0.5 ${unread ? 'text-blue-850 font-semibold' : 'text-gray-500'}`}>
                                                        {chat.lastMessage}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {unread && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                                                    )}
                                                    <button 
                                                        onClick={() => handleOpenChat(chat)}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                                                    >
                                                        Conversar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CollapsibleSection>
                    </div>
                </div>

                {/* Configuration Panel */}
                <div className="mt-6 bg-white p-5 rounded-2xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Configurações do Aplicativo</h2>
                    <p className="text-xs text-gray-500 mb-4">Gerencie as opções de visibilidade dos recursos do aplicativo em tempo real.</p>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-gray-800 text-sm">Visibilidade do Botão de Download (APK)</span>
                            <span className="text-xs text-gray-500 mt-1">Selecione para qual público o botão de download do APK será exibido na tela inicial.</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'android', 'ios', 'none'] as const).map((opt) => {
                                const labels = {
                                    all: '📱 Mostrar para Todos',
                                    android: '🤖 Apenas Android',
                                    ios: '🍏 Apenas iOS',
                                    none: '🚫 Ocultar para Todos'
                                };
                                const isActive = apkVisibility === opt;
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleUpdateApkVisibility(opt)}
                                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                            isActive 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {labels[opt]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
            <BottomNav />

            {/* Add / Edit University Modal */}
            {showUniModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <form 
                        onSubmit={handleSaveUniversity}
                        className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md relative text-left animate-[scaleUp_0.2s_ease-out] flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center pb-2 border-b">
                            <h3 className="text-lg font-bold text-gray-800">
                                {uniModalMode === 'add' ? 'Cadastrar Faculdade' : 'Editar Faculdade'}
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setShowUniModal(false)}
                                className="p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-600 transition"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {uniError && (
                            <div className="text-xs font-semibold text-red-650 bg-red-50 p-3 rounded-lg border border-red-100">
                                {uniError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nome da Faculdade</label>
                                <input
                                    type="text"
                                    value={uniName}
                                    onChange={(e) => setUniName(e.target.value)}
                                    placeholder="Ex: Universidade de São Paulo"
                                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Domínio de E-mail Institucional</label>
                                <input
                                    type="text"
                                    value={uniDomain}
                                    onChange={(e) => setUniDomain(e.target.value)}
                                    placeholder="Ex: mail.usp.br"
                                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cidade (Opcional)</label>
                                    <input
                                        type="text"
                                        value={uniCity}
                                        onChange={(e) => setUniCity(e.target.value)}
                                        placeholder="Ex: São Paulo"
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Estado (Opcional)</label>
                                    <input
                                        type="text"
                                        value={uniState}
                                        onChange={(e) => setUniState(e.target.value)}
                                        placeholder="Ex: SP"
                                        maxLength={2}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Campuses (separados por vírgula)</label>
                                <textarea
                                    value={uniCampuses}
                                    onChange={(e) => setUniCampuses(e.target.value)}
                                    placeholder="Ex: Mooca, Paulista, Butantã"
                                    rows={2}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Logotipo da Faculdade</label>
                                <div className="flex items-center gap-4 mt-1">
                                    {(uniLogoFile || uniLogoUrl) ? (
                                        <img 
                                            src={uniLogoFile ? URL.createObjectURL(uniLogoFile) : uniLogoUrl} 
                                            alt="Preview" 
                                            className="w-14 h-14 object-contain bg-gray-50 border p-1 rounded-lg shrink-0" 
                                        />
                                    ) : (
                                        <div className="w-14 h-14 bg-gray-100 border border-dashed rounded-lg flex items-center justify-center text-xs text-gray-400 font-bold shrink-0">Logo</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && setUniLogoFile(e.target.files[0])}
                                        className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t mt-2">
                            <button
                                type="button"
                                onClick={() => setShowUniModal(false)}
                                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                                disabled={savingUni}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                                disabled={savingUni}
                            >
                                {savingUni ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    'Salvar'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Permissions Wizard Modal */}
            {showPermModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md relative text-left animate-[scaleUp_0.2s_ease-out] flex flex-col gap-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <div className="flex flex-col">
                                <h3 className="text-base font-bold text-gray-800">Gerenciar Permissões</h3>
                                <span className="text-xs text-gray-500 mt-0.5">{permUserName}</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowPermModal(false)}
                                className="p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-600 transition"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Steps indicator */}
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${permStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
                            <span className="w-8 h-0.5 bg-gray-200"></span>
                            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${permStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
                            <span className="w-8 h-0.5 bg-gray-200"></span>
                            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${permStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
                        </div>

                        {/* Step 1: Admin Status */}
                        {permStep === 1 && (
                            <div className="space-y-4 py-2">
                                <h4 className="text-sm font-bold text-gray-700">Etapa 1: Definir Status do Usuário</h4>
                                <p className="text-xs text-gray-500">Defina se este usuário deve possuir nível de acesso de Administrador.</p>
                                
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                    <div>
                                        <span className="text-sm font-bold text-gray-800">Perfil Administrador</span>
                                        <p className="text-xs text-gray-400 mt-0.5">Permite o acesso ao painel de controle e funções especiais.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPermIsAdmin(!permIsAdmin)}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${permIsAdmin ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <span className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${permIsAdmin ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Admin Privileges */}
                        {permStep === 2 && (
                            <div className="space-y-3 py-1">
                                <h4 className="text-sm font-bold text-gray-700">Etapa 2: Distribuir Funcionalidades</h4>
                                <p className="text-xs text-gray-500">Selecione quais operações administrativas este administrador poderá realizar.</p>
                                
                                {!permIsAdmin ? (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-xs text-yellow-800">
                                        ⚠️ O usuário não está configurado como Administrador. Ative o perfil administrador no passo anterior para definir suas permissões.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {[
                                            { label: 'Aprovar Usuários', desc: 'Permite aprovar novas contas pendentes', state: permApproveUsers, setter: setPermApproveUsers },
                                            { label: 'Gerenciar Faculdades', desc: 'Permite cadastrar/editar/excluir faculdades', state: permManageUnis, setter: setPermManageUnis },
                                            { label: 'Enviar Notificações', desc: 'Permite disparar notificações em massa', state: permSendNotifications, setter: setPermSendNotifications },
                                            { label: 'Excluir Usuários', desc: 'Permite deletar estudantes cadastrados', state: permDeleteUsers, setter: setPermDeleteUsers }
                                        ].map((p, idx) => (
                                            <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 gap-3">
                                                <div className="min-w-0">
                                                    <span className="text-xs font-bold text-gray-800">{p.label}</span>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => p.setter(!p.state)}
                                                    className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 mt-0.5 ${p.state ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${p.state ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Review & Save */}
                        {permStep === 3 && (
                            <div className="space-y-4 py-2 text-left">
                                <h4 className="text-sm font-bold text-gray-700">Etapa 3: Revisar Permissões</h4>
                                <p className="text-xs text-gray-500">Confirme a nova configuração de privilégios para este usuário.</p>
                                
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5">
                                    <div className="text-xs">
                                        <span className="text-gray-400 font-medium">Status de Acesso:</span>
                                        <span className={`font-bold ml-1.5 ${permIsAdmin ? 'text-purple-600' : 'text-gray-600'}`}>
                                            {permIsAdmin ? 'ADMINISTRADOR' : 'ESTUDANTE COMUM'}
                                        </span>
                                    </div>

                                    {permIsAdmin && (
                                        <div className="text-xs">
                                            <span className="text-gray-400 font-medium">Capacidades Ativas:</span>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {[
                                                    permApproveUsers && 'Aprovar Contas',
                                                    permManageUnis && 'Gerenciar Faculdades',
                                                    permSendNotifications && 'Enviar Notificações',
                                                    permDeleteUsers && 'Excluir Contas'
                                                ].filter(Boolean).map((cap: any, cIdx) => (
                                                    <span key={cIdx} className="bg-purple-100/50 text-purple-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                                        {cap}
                                                    </span>
                                                ))}
                                                {![permApproveUsers, permManageUnis, permSendNotifications, permDeleteUsers].some(Boolean) && (
                                                    <span className="text-gray-450 italic">Nenhuma funcionalidade atribuída</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer buttons */}
                        <div className="flex gap-3 pt-3 border-t mt-2">
                            <button
                                type="button"
                                onClick={() => permStep > 1 ? setPermStep(permStep - 1) : setShowPermModal(false)}
                                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                                disabled={savingPerm}
                            >
                                {permStep > 1 ? 'Voltar' : 'Cancelar'}
                            </button>
                            <button
                                type="button"
                                onClick={() => permStep < 3 ? setPermStep(permStep + 1) : handleSavePermissions()}
                                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                                disabled={savingPerm}
                            >
                                {savingPerm ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : permStep < 3 ? (
                                    'Avançar'
                                ) : (
                                    'Confirmar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Support Chat Modal */}
            {showChatModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[80vh] relative text-left animate-[scaleUp_0.2s_ease-out] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b shrink-0 bg-white">
                            <div className="flex flex-col text-left">
                                <h3 className="text-base font-bold text-gray-800">Suporte Oficial</h3>
                                <span className="text-xs text-gray-500 mt-0.5">Conversando com {activeChatUserName}</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowChatModal(false)}
                                className="p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-600 transition"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Message Log */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
                            {chatMessages.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-12">Nenhuma mensagem nesta conversa.</p>
                            ) : (
                                chatMessages.map((msg) => {
                                    const isAdminMsg = msg.role === 'admin';
                                    const timeStr = msg.timestamp
                                        ? new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                        : '';
                                    return (
                                        <div key={msg.id} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm text-sm text-left relative flex flex-col gap-1 ${isAdminMsg ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                <span className={`text-[9px] self-end mt-0.5 ${isAdminMsg ? 'text-blue-200' : 'text-gray-400'}`}>{timeStr}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input form */}
                        <form 
                            onSubmit={handleSendAdminChatMessage} 
                            className="p-3 border-t bg-white shrink-0 flex gap-2 items-center"
                        >
                            <input
                                type="text"
                                placeholder="Digite sua resposta..."
                                value={adminChatInput}
                                onChange={(e) => setAdminChatInput(e.target.value)}
                                className="flex-1 p-3 border border-gray-300 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={sendingChatMessage}
                                required
                            />
                            <button
                                type="submit"
                                className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center shadow-md shrink-0 w-11 h-11"
                                disabled={sendingChatMessage || !adminChatInput.trim()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
