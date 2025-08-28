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
  updatedAt?: firebase.firestore.FieldValue;
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

// Define QuerySnapshot type for compat mode.
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

  // This effect sets up two parallel, independent listeners:
  // 1. For the global `/notifications` collection.
  // 2. For the user-specific `/profiles/{uid}/notificationStatus` subcollection.
  // This robust approach ensures data is fetched correctly and independently, preventing race conditions.
  useEffect(() => {
    // On logout or if no user, clean up state and listeners.
    if (!user) {
      setGlobalNotifications([]);
      setUserStatuses({});
      return;
    }

    isInitialLoad.current = true;
    
    // --- Listener 1: Global Notifications ---
    // To solve the refresh problem for normal users, we unify the query logic.
    // Both admins and normal users now fetch from the global collection using the same base query.
    // This avoids issues with composite indexes that might not be configured in Firestore.
    // We will filter for 'active' notifications on the client-side for non-admins.
    const notificationsQuery = db.collection("notifications").orderBy("createdAt", "desc");
      
    const unsubNotifications = notificationsQuery.onSnapshot((snapshot: QuerySnapshot) => {
        let allNotifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];

        // Client-side filtering for regular users to ensure they only see active notifications.
        if (!user.isAdmin) {
            allNotifs = allNotifs.filter(n => n.active === true);
        }
        
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
    }, (error) => {
        console.error("Error fetching global notifications:", error);
        // This error often indicates a missing Firestore index.
        // Check the browser console for a link to create it in the Firebase console.
        setGlobalNotifications([]);
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
    }, (error) => {
        console.error("Error fetching user notification statuses:", error);
        setUserStatuses({});
    });

    // Cleanup function for when the component unmounts or the user changes.
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
        if (!n.read && !n.dismissed) {
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