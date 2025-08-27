import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../firebase';
// FIX: Removed modular imports and switched to compat API to resolve module export errors.
import type firebase from 'firebase/compat/app';
import { useAuth } from './AuthContext';
import type { Notification } from '../types';

// This will be the structure for statuses stored in Firestore.
// e.g., /profiles/{userId}/notificationStatus/{notificationId} -> { read: true, dismissed: false }
interface NotificationStatus {
  read?: boolean;
  dismissed?: boolean;
}

// A map for easy lookup in the state: { [notificationId]: { read: true, dismissed: false } }
type NotificationStatusMap = Record<string, NotificationStatus>;

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isRead: (id: string) => boolean; // Helper function instead of exposing the whole set
  hasNewNotification: boolean;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  toggleReadStatus: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// FIX: Define QuerySnapshot type for compat mode.
type QuerySnapshot = firebase.firestore.QuerySnapshot;

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allActiveNotifications, setAllActiveNotifications] = useState<Notification[]>([]);
  const [userNotificationStatuses, setUserNotificationStatuses] = useState<NotificationStatusMap>({});
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const isInitialLoad = useRef(true);

  // Effect to listen for global notifications
  useEffect(() => {
    // Reset state on logout
    if (!user) {
      setAllActiveNotifications([]);
      isInitialLoad.current = true;
      return;
    }

    // FIX: Refactored query to use v8 namespaced API.
    const q = db.collection("notifications")
        .where("active", "==", true)
        .orderBy("createdAt", "desc");

    // FIX: Refactored listener to use v8 namespaced API.
    const unsubscribe = q.onSnapshot((snapshot: QuerySnapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      
      setAllActiveNotifications(prevNotifications => {
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        } else {
          const newNotificationExists = notificationsData.some(newNotif => 
            !prevNotifications.some(oldNotif => oldNotif.id === newNotif.id)
          );
          
          if (newNotificationExists) {
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1500);
          }
        }
        return notificationsData;
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Effect to listen for user-specific notification statuses
  useEffect(() => {
    if (!user) {
      setUserNotificationStatuses({});
      return;
    }

    // FIX: Refactored collection reference to use v8 namespaced API.
    const statusCollectionRef = db.collection('profiles').doc(user.uid).collection('notificationStatus');
    // FIX: Refactored listener to use v8 namespaced API.
    const unsubscribe = statusCollectionRef.onSnapshot((snapshot: QuerySnapshot) => {
        const statuses: NotificationStatusMap = {};
        snapshot.docs.forEach(doc => {
            statuses[doc.id] = doc.data() as NotificationStatus;
        });
        setUserNotificationStatuses(statuses);
    });

    return () => unsubscribe();
  }, [user]);

  const notifications = useMemo(() => {
    return allActiveNotifications.filter(n => !userNotificationStatuses[n.id]?.dismissed);
  }, [allActiveNotifications, userNotificationStatuses]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !userNotificationStatuses[n.id]?.read).length;
  }, [notifications, userNotificationStatuses]);

  const isRead = useCallback((id: string) => {
    return !!userNotificationStatuses[id]?.read;
  }, [userNotificationStatuses]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    // FIX: Refactored batch write to use v8 namespaced API.
    const batch = db.batch();
    notifications.forEach(n => {
        if (!userNotificationStatuses[n.id]?.read) {
            const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(n.id);
            batch.set(statusRef, { read: true }, { merge: true });
        }
    });
    await batch.commit();
  }, [user, notifications, userNotificationStatuses]);

  const dismissNotification = useCallback(async (id: string) => {
    if (!user) return;
    // FIX: Refactored doc reference and set to use v8 namespaced API.
    const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(id);
    await statusRef.set({ dismissed: true }, { merge: true });
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    // FIX: Refactored batch write to use v8 namespaced API.
    const batch = db.batch();
    notifications.forEach(n => {
        const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(n.id);
        batch.set(statusRef, { dismissed: true }, { merge: true });
    });
    await batch.commit();
  }, [user, notifications]);
  
  const toggleReadStatus = useCallback(async (id: string) => {
    if (!user) return;
    const currentReadStatus = !!userNotificationStatuses[id]?.read;
    // FIX: Refactored doc reference and set to use v8 namespaced API.
    const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(id);
    await statusRef.set({ read: !currentReadStatus }, { merge: true });
  }, [user, userNotificationStatuses]);


  const value = {
    notifications,
    unreadCount,
    isRead,
    hasNewNotification,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    toggleReadStatus,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
