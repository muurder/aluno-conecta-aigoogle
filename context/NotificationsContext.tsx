import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../firebase';
// FIX: Removed modular imports and switched to compat API to resolve module export errors.
import type firebase from 'firebase/compat/app';
import { useAuth } from './AuthContext';
import type { Notification } from '../types';

// This will be the structure for statuses stored in Firestore.
// e.g., /profiles/{userId}/notificationStatus/{notificationId} -> { read: true, dismissed: true }
interface NotificationStatus {
  read?: boolean;
  dismissed?: boolean;
}

// A map for easy lookup in the state: { [notificationId]: { read: true, dismissed: false } }
type NotificationStatusMap = Record<string, NotificationStatus>;

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const isInitialLoad = useRef(true);
  // FIX: Explicitly initialize useRef with undefined. The no-argument version of useRef() can cause errors with some TypeScript/React type versions. The type is for a function that returns void, or is undefined.
  const unsubStatusRef = useRef<(() => void) | undefined>(undefined);

  // This single, nested listener solves the race condition problem.
  // It ensures that we always have the global notifications before trying to merge user statuses.
  useEffect(() => {
    // On logout, clean up everything
    if (!user) {
      setNotifications([]);
      if (unsubStatusRef.current) unsubStatusRef.current();
      isInitialLoad.current = true;
      return;
    }

    const notificationsQuery = db.collection("notifications")
        .where("active", "==", true)
        .orderBy("createdAt", "desc");

    const unsubNotifications = notificationsQuery.onSnapshot((notificationsSnapshot: QuerySnapshot) => {
      const allNotifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];

      // Bell animation logic
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      } else {
        const currentIds = new Set(notifications.map(n => n.id));
        const newNotificationExists = allNotifications.some(newNotif => !currentIds.has(newNotif.id));
        if (newNotificationExists) {
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1500);
        }
      }

      // Cleanup previous status listener if it exists to avoid memory leaks
      if (unsubStatusRef.current) {
        unsubStatusRef.current();
      }

      // Nested listener for user-specific statuses
      const statusCollectionRef = db.collection('profiles').doc(user.uid).collection('notificationStatus');
      unsubStatusRef.current = statusCollectionRef.onSnapshot((statusSnapshot: QuerySnapshot) => {
          const statuses: NotificationStatusMap = {};
          statusSnapshot.docs.forEach(doc => {
              statuses[doc.id] = doc.data() as NotificationStatus;
          });
          
          // Merge global notifications with user statuses
          const mergedNotifications = allNotifications
            .filter(n => !statuses[n.id]?.dismissed)
            .map(notification => ({
              ...notification,
              read: !!statuses[notification.id]?.read
            }));
          
          setNotifications(mergedNotifications);
      });
    });

    // Cleanup function for the main effect
    return () => {
      unsubNotifications();
      if (unsubStatusRef.current) {
        unsubStatusRef.current();
      }
    };
  }, [user, notifications]); // Dependency on `notifications` is for the bell animation logic

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const batch = db.batch();
    notifications.forEach(n => {
        if (!n.read) {
            const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(n.id);
            batch.set(statusRef, { read: true }, { merge: true });
        }
    });
    await batch.commit();
  }, [user, notifications]);

  const dismissNotification = useCallback(async (id: string) => {
    if (!user) return;
    const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(id);
    await statusRef.set({ dismissed: true }, { merge: true });
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    const batch = db.batch();
    notifications.forEach(n => {
        const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(n.id);
        batch.set(statusRef, { dismissed: true }, { merge: true });
    });
    await batch.commit();
  }, [user, notifications]);
  
  const toggleReadStatus = useCallback(async (id: string) => {
    if (!user) return;
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    
    const currentReadStatus = !!notification.read;
    const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(id);
    await statusRef.set({ read: !currentReadStatus }, { merge: true });
  }, [user, notifications]);


  const value = {
    notifications,
    unreadCount,
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
