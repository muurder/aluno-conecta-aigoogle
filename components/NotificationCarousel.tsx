import React, { useMemo } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import type { Notification } from '../types';
import { XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

const NotificationCard: React.FC<{ notification: Notification, onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
    const config = useMemo(() => {
        const baseConfig = {
            info: {
                icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
                title: 'Informação',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
            },
            warning: {
                icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />,
                title: 'Aviso',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200'
            },
            urgent: {
                icon: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
                title: 'Urgente',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200'
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
        <div className={`w-full p-4 rounded-2xl shadow-md flex flex-col gap-3 ${config.bgColor} border ${config.borderColor} relative z-10 bg-clip-padding`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    {config.icon}
                    <h3 className="font-bold text-gray-800">{config.title}</h3>
                </div>
                <button
                    onClick={() => onDismiss(notification.id)}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-400/20"
                    aria-label="Dispensar notificação"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="text-sm text-gray-700">{notification.message}</p>
            {formattedDate && <p className="text-xs text-gray-500 text-right mt-1">📅 {formattedDate}</p>}
        </div>
    );
};


const NotificationCarousel: React.FC = () => {
    const { notifications, dismissNotification } = useNotifications();
    
    // Only show notifications that have not been dismissed by the user
    const visibleNotifications = useMemo(() => notifications.filter(n => !n.dismissed), [notifications]);
    
    const notificationToShow = visibleNotifications[0];

    if (!notificationToShow) {
        return null;
    }

    return (
        <div className="relative">
            {/* These divs create the stacked card effect */}
            <div 
                className="absolute w-[calc(100%-16px)] h-full bg-gray-200 rounded-2xl top-2 left-2 -z-10"
                style={{ display: visibleNotifications.length > 1 ? 'block' : 'none' }}
            />
             <div 
                className="absolute w-[calc(100%-32px)] h-full bg-gray-300 rounded-2xl top-4 left-4 -z-20"
                style={{ display: visibleNotifications.length > 2 ? 'block' : 'none' }}
            />
            
            <NotificationCard 
                notification={notificationToShow} 
                onDismiss={dismissNotification}
            />
            {visibleNotifications.length > 1 && (
                <div className="text-right text-xs text-gray-500 mt-2 pr-2 font-medium">
                    Mais {visibleNotifications.length - 1} aviso(s) para ver
                </div>
            )}
        </div>
    );
};

export default NotificationCarousel;