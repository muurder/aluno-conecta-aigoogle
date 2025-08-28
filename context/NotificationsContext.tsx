import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
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
  
  // Final merged notifications for the UI
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // State for raw data from listeners
  const [globalNotifications, setGlobalNotifications] = useState<Notification[]>([]);
  const [userStatuses, setUserStatuses] = useState<NotificationStatusMap>({});
  
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const isInitialLoad = useRef(true);

  // This refactored effect sets up two parallel, independent listeners.
  // One for the global `/notifications` collection and one for the user-specific status subcollection.
  // This approach is more robust and avoids potential race conditions from nested listeners.
  useEffect(() => {
    // On logout or if no user, clean up state and listeners.
    if (!user) {
      setGlobalNotifications([]);
      setUserStatuses({});
      return;
    }

    isInitialLoad.current = true;
    
    // --- Listener 1: Global Notifications ---
    // Fetches all notifications visible to the current user (admins see all, users see active ones).
    const notificationsQuery = user.isAdmin
      ? db.collection("notifications").orderBy("createdAt", "desc")
      : db.collection("notifications").where("active", "==", true).orderBy("createdAt", "desc");
      
    const unsubNotifications = notificationsQuery.onSnapshot((snapshot: QuerySnapshot) => {
        const allNotifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        setGlobalNotifications(allNotifs);

        // Bell animation logic: trigger only on new documents after the initial load.
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        } else {
          const hasAddedChange = snapshot.docChanges().some(change => change.type === "added");
          if (hasAddedChange) {
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1500); // Animation duration
          }
        }
    });

    // --- Listener 2: User-specific Statuses ---
    // Fetches the read/dismissed status for notifications for the logged-in user.
    const statusQuery = db.collection("profiles").doc(user.uid).collection("notificationStatus");
    const unsubStatuses = statusQuery.onSnapshot((snapshot: QuerySnapshot) => {
        const statusMap: NotificationStatusMap = {};
        snapshot.docs.forEach((doc) => {
            statusMap[doc.id] = doc.data() as NotificationStatus;
        });
        setUserStatuses(statusMap);
    });

    // The main cleanup function for the useEffect hook.
    return () => {
      unsubNotifications();
      unsubStatuses();
    };
  }, [user]);

  // This effect runs whenever the global list or user statuses change.
  // It merges the two sources of data into the final `notifications` state for the UI.
  useEffect(() => {
      const merged = globalNotifications.map((notif) => {
          const status = userStatuses[notif.id];
          return {
              ...notif,
              read: status?.read || false,
              dismissed: status?.dismissed || false,
          };
      });
      setNotifications(merged);
  }, [globalNotifications, userStatuses]);


  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read && !n.dismissed).length;
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const batch = db.batch();
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    notifications.forEach(n => {
        if (!n.read) {
            const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(n.id);
            batch.set(statusRef, { read: true, updatedAt: timestamp }, { merge: true });
        }
    });
    await batch.commit();
  }, [user, notifications]);

  const dismissNotification = useCallback(async (id: string) => {
    if (!user) return;
    const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(id);
    await statusRef.set({ 
      dismissed: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    const batch = db.batch();
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    notifications.forEach(n => {
        const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(n.id);
        batch.set(statusRef, { dismissed: true, updatedAt: timestamp }, { merge: true });
    });
    await batch.commit();
  }, [user, notifications]);
  
  const toggleReadStatus = useCallback(async (id: string) => {
    if (!user) return;
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    
    const currentReadStatus = !!notification.read;
    const statusRef = db.collection('profiles').doc(user.uid).collection('notificationStatus').doc(id);
    await statusRef.set({
      read: !currentReadStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
    }, { merge: true });
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
