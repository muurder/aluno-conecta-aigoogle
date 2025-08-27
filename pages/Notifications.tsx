import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { ArrowLeftIcon, CheckBadgeIcon, TrashIcon, BellSlashIcon } from '@heroicons/react/24/solid';
import { XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import type { Notification } from '../types';

const NotificationItem: React.FC<{ notification: Notification, onDismiss: (id: string) => Promise<void>, onToggleRead: (id: string) => Promise<void> }> = ({ notification, onDismiss, onToggleRead }) => {
    const isRead = !!notification.read;
    const isDismissed = !!notification.dismissed;

    const config = useMemo(() => {
        const baseConfig = {
            info: {
                borderColor: 'border-blue-500',
                icon: <InformationCircleIcon className="w-7 h-7 text-blue-500" />,
                title: '📢 Informação',
            },
            warning: {
                borderColor: 'border-yellow-500',
                icon: <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />,
                title: '📢 Aviso Importante',
            },
            urgent: {
                borderColor: 'border-red-500',
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
        <div className={`bg-white p-4 rounded-lg shadow-md relative border-l-4 ${config.borderColor} transition-all duration-300 ${!isRead ? 'bg-blue-50' : ''} ${isDismissed ? 'opacity-60' : ''}`}>
             <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{config.icon}</div>
                <div className="flex-grow pr-6">
                    <p className="font-bold text-gray-800">{config.title}</p>
                    <p className="text-sm mt-1 text-gray-600 whitespace-pre-wrap">{notification.message}</p>
                </div>
            </div>
            {formattedDate && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                    <button 
                        onClick={() => onToggleRead(notification.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={isRead ? 'Marcar como não lida' : 'Marcar como lida'}
                        disabled={isDismissed}
                    >
                        {isRead ? <EnvelopeOpenIcon className="w-4 h-4" /> : <EnvelopeIcon className="w-4 h-4" />}
                        <span>{isRead ? 'Marcar como não lida' : 'Marcar como lida'}</span>
                    </button>
                    <p className="text-xs text-gray-500">📅 {formattedDate}</p>
                </div>
            )}
            <button
                onClick={() => onDismiss(notification.id)}
                className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Dispensar notificação"
                disabled={isDismissed}
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { notifications, markAllAsRead, clearAllNotifications, dismissNotification, toggleReadStatus } = useNotifications();
    
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="p-4 flex items-center justify-between text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-lg">Notificações</h1>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={markAllAsRead} title="Marcar todas como lidas" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <CheckBadgeIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => { if (confirm('Tem certeza que deseja limpar todas as notificações?')) clearAllNotifications() }} title="Limpar todas as notificações" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <TrashIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="flex-grow p-4 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <BellSlashIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700">Tudo limpo!</h2>
                        <p>Você não tem nenhuma notificação no momento.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map(notification => (
                            <NotificationItem 
                                key={notification.id} 
                                notification={notification} 
                                onDismiss={dismissNotification}
                                onToggleRead={toggleReadStatus}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notifications;