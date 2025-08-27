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

  // This effect fetches global notifications and merges them with user-specific statuses.
  // It uses nested listeners to ensure data consistency and avoids race conditions.
  // The dependency is only on `user`, so listeners are set up once per session.
  useEffect(() => {
    // On logout or if no user, clean up state and listeners.
    if (!user) {
      setNotifications([]);
      return;
    }

    // This ref helps prevent the "new notification" bell animation on the initial data load.
    isInitialLoad.current = true;

    // Listener for global notifications
    const unsubNotifications = db.collection("notifications")
      .where("active", "==", true)
      .orderBy("createdAt", "desc")
      .onSnapshot((notifSnap: QuerySnapshot) => {
        
        // Bell animation logic: trigger only on new documents after the initial load.
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        } else {
          const hasAddedChange = notifSnap.docChanges().some(change => change.type === "added");
          if (hasAddedChange) {
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1500); // Animation duration
          }
        }

        const allNotifications = notifSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];

        // Nested listener for the user's individual notification statuses
        const unsubStatus = db.collection("profiles")
          .doc(user.uid)
          .collection("notificationStatus")
          .onSnapshot((statusSnap: QuerySnapshot) => {
            const statusMap: NotificationStatusMap = {};
            statusSnap.docs.forEach((doc) => {
              statusMap[doc.id] = doc.data() as NotificationStatus;
            });

            // Combine global notifications with individual user statuses
            const mergedNotifications = allNotifications
              .map((notif) => {
                const state = statusMap[notif.id];
                if (state?.dismissed) return null; // Exclude if dismissed by user
                return {
                  ...notif,
                  read: state?.read || false, // Apply read status, default to false
                };
              })
              .filter(Boolean) as Notification[]; // Filter out the null (dismissed) items

            setNotifications(mergedNotifications);
          });

        // The cleanup for the inner listener is returned here.
        return unsubStatus;
      });

    // The cleanup for the outer listener.
    return unsubNotifications;
  }, [user]);

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