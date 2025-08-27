import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COURSE_ICONS } from '../constants';
import { schedulesData, Schedule } from '../schedules';
import { db } from '../firebase';
// FIX: Import QuerySnapshot to explicitly type the snapshot from onSnapshot.
import { collection, query, where, orderBy, onSnapshot, type QuerySnapshot } from 'firebase/firestore';
import type { Notification } from '../types';
import { 
    ArrowRightIcon, 
    MagnifyingGlassIcon, 
    BookOpenIcon, 
    DocumentTextIcon, 
    BanknotesIcon, 
    IdentificationIcon,
    CalendarDaysIcon,
    ComputerDesktopIcon,
    BellIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';


const NotificationCard: React.FC<{ notification: Notification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
    const config = useMemo(() => {
        const baseConfig = {
            info: {
                bgColor: 'bg-blue-100 border-blue-500',
                textColor: 'text-blue-900',
                icon: <InformationCircleIcon className="w-7 h-7 text-blue-500" />,
                title: '📢 Informação',
            },
            warning: {
                bgColor: 'bg-yellow-100 border-yellow-500',
                textColor: 'text-yellow-900',
                icon: <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />,
                title: '📢 Aviso Importante',
            },
            urgent: {
                bgColor: 'bg-red-100 border-red-500',
                textColor: 'text-red-900',
                icon: <ExclamationCircleIcon className="w-7 h-7 text-red-500" />,
                title: '📢 Urgente',
            },
        };
        return baseConfig[notification.type] || baseConfig.info;
    }, [notification.type]);

    const formattedDate = useMemo(() => {
        if (!notification.createdAt?.seconds) return '';
        return new Date(notification.createdAt.seconds * 1000).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }, [notification.createdAt]);

    return (
        <div className={`p-4 rounded-lg shadow-md relative border-l-4 ${config.bgColor} ${config.textColor}`} role="alert">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{config.icon}</div>
                <div className="flex-grow pr-6">
                    <p className="font-bold">{config.title}</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{notification.message}</p>
                </div>
            </div>
            {formattedDate && (
                <div className="mt-3 pt-2 border-t border-black/10 text-right">
                    <p className="text-xs text-gray-500">📅 {formattedDate}</p>
                </div>
            )}
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 p-1 rounded-full text-black/40 hover:bg-black/10"
                aria-label="Dispensar notificação"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Create a user-specific key for localStorage to track read notifications.
    const storageKey = useMemo(() => user ? `read_notifications_${user.uid}` : null, [user]);

    useEffect(() => {
        // Only fetch notifications if the user-specific storage key is available.
        if (!storageKey) return;

        const q = query(
            collection(db, "notifications"),
            where("active", "==", true),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
            const allActiveNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
            // Retrieve the list of read notification IDs for the current user.
            const readNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
            // Filter out notifications that have already been read by this user.
            const unreadNotifications = allActiveNotifications.filter(n => !readNotifications.includes(n.id));
            setNotifications(unreadNotifications);
        });

        return () => unsubscribe();
    }, [storageKey]);

    const dismissNotification = (id: string) => {
        // Ensure we have the user-specific key before modifying localStorage.
        if (!storageKey) return;

        const readNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedReadNotifications = [...readNotifications, id];
        // Save the updated list of read IDs back to localStorage for the current user.
        localStorage.setItem(storageKey, JSON.stringify(updatedReadNotifications));
        // Update the local state to remove the notification from view.
        setNotifications(prev => prev.filter(n => n.id !== id));
    };


    const { ambientSubtitle } = useMemo(() => {
        if (!user?.course) return { ambientSubtitle: 'Acessar aulas online' };

        const courseSchedule = schedulesData.filter(item => item.disciplina === user.course);
        if (courseSchedule.length === 0) {
            return { ambientSubtitle: 'Nenhum horário cadastrado' };
        }

        const now = new Date();
        const todayIndex = now.getDay(); // Sunday: 0, Monday: 1, ...
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const dayNameMapping: Record<Schedule['dia_semana'], number> = {
            'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
        };

        const futureClasses = courseSchedule.filter(c => {
             const classDay = dayNameMapping[c.dia_semana];
             const dayDiff = (classDay - todayIndex + 7) % 7;
             if (dayDiff > 0) return true;
             if (dayDiff === 0 && c.inicio > currentTime) return true;
             return false;
        }).sort((a, b) => {
            const dayA = dayNameMapping[a.dia_semana];
            const dayB = dayNameMapping[b.dia_semana];
            const diffA = (dayA - todayIndex + 7) % 7;
            const diffB = (dayB - todayIndex + 7) % 7;
            if (diffA !== diffB) return diffA - diffB;
            return a.inicio.localeCompare(b.inicio);
        });

        if (futureClasses.length > 0) {
            const firstUpcoming = futureClasses[0];
            const isToday = dayNameMapping[firstUpcoming.dia_semana] === todayIndex;
            const prefix = isToday ? 'Próxima aula: Hoje' : `Próxima aula: ${firstUpcoming.dia_semana}`;
            return {
                ambientSubtitle: `${firstUpcoming.observacoes} - ${prefix} às ${firstUpcoming.inicio}`
            };
        }

        return { ambientSubtitle: 'Sem próximas aulas na semana' };
    }, [user]);

    const courseIcon = (user?.course && COURSE_ICONS[user.course]) || COURSE_ICONS["Default"];

    const ActionCard: React.FC<{
        title: string;
        subtitle: string;
        bgColor: string;
        icon: React.ReactNode;
        onClick?: () => void;
    }> = ({ title, subtitle, bgColor, icon, onClick }) => (
        <button 
            onClick={onClick} 
            className={`w-full p-4 rounded-2xl text-white shadow-lg flex items-center justify-between ${bgColor} transition-transform transform-gpu hover:scale-[1.02] hover:shadow-xl relative overflow-hidden`}
        >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full opacity-80 blur-sm"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-full">
                    {icon}
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-sm opacity-90 max-w-[200px] truncate">{subtitle}</p>
                </div>
            </div>
            <div className="relative z-10">
                <ArrowRightIcon className="w-6 h-6" />
            </div>
        </button>
    );

    const HelpItem: React.FC<{title: string, icon: React.ReactNode, onClick?: () => void}> = ({title, icon, onClick}) => (
        <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 p-3 bg-white rounded-lg hover:bg-gray-100 transition w-full border border-gray-200">
            {icon}
            <span className="text-xs text-center text-gray-700 font-medium">{title}</span>
        </button>
    );

    return (
        <div className="p-4 space-y-6">
            {notifications.length > 0 && (
                <div className="space-y-2">
                    {notifications.length > 1 && (
                        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold shadow-sm">
                            <BellIcon className="w-5 h-5" />
                            <span>{notifications.length} avisos novos</span>
                        </div>
                    )}
                    <NotificationCard 
                        notification={notifications[0]} 
                        onDismiss={() => dismissNotification(notifications[0].id)} 
                    />
                </div>
            )}
            
            {/* User Info Card */}
            <div className="bg-blue-800 text-white p-5 rounded-xl shadow-md relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold">{user?.course}</h2>
                    <div className="mt-4 inline-block bg-cyan-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Cursando
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 text-white bg-white/20 rounded-full p-2">
                        {courseIcon}
                    </div>
                </div>
            </div>
            
            {/* Action Cards */}
            <div className="space-y-4">
                <ActionCard 
                    title="Ambiente virtual" 
                    subtitle={ambientSubtitle} 
                    bgColor="bg-gradient-to-br from-blue-500 to-blue-700" 
                    icon={<ComputerDesktopIcon className="w-7 h-7" />}
                    onClick={() => navigate('/class-schedule')}
                />
                <ActionCard 
                    title="Horários de aulas" 
                    subtitle="Disciplinas, sala e professor" 
                    bgColor="bg-gradient-to-br from-green-500 to-teal-600" 
                    icon={<CalendarDaysIcon className="w-7 h-7" />}
                    onClick={() => navigate('/class-schedule')}
                />
            </div>

            {/* Help Center */}
            <div>
                <h3 className="font-bold text-gray-500 mb-2 uppercase text-sm tracking-wider">Central de Ajuda</h3>
                <div className="relative">
                    <input type="text" placeholder="Procurar no app" className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white"/>
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <HelpItem title="Disciplinas e atividades" icon={<BookOpenIcon className="w-8 h-8 text-teal-600"/>} onClick={() => navigate('/my-course')}/>
                    <HelpItem title="Emissão de documentos" icon={<DocumentTextIcon className="w-8 h-8 text-teal-600"/>}/>
                    <HelpItem title="Carteirinha Virtual" icon={<IdentificationIcon className="w-8 h-8 text-teal-600"/>} onClick={() => navigate('/virtual-id')} />
                    <HelpItem title="Financeiro" icon={<BanknotesIcon className="w-8 h-8 text-teal-600" />} onClick={() => navigate('/financial')} />
                </div>
            </div>
        </div>
    );
};

export default Home;