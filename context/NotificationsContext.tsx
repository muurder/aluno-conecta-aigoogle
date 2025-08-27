import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, type QuerySnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { Notification } from '../types';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  readIds: Set<string>;
  hasNewNotification: boolean;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toggleReadStatus: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allActiveNotifications, setAllActiveNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const isInitialLoad = useRef(true);

  const readStorageKey = useMemo(() => user ? `read_notifications_${user.uid}` : null, [user]);
  const dismissedStorageKey = useMemo(() => user ? `dismissed_notifications_${user.uid}` : null, [user]);

  useEffect(() => {
    if (readStorageKey) {
      const storedRead = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      setReadIds(new Set(storedRead));
    }
    if (dismissedStorageKey) {
      const storedDismissed = JSON.parse(localStorage.getItem(dismissedStorageKey) || '[]');
      setDismissedIds(new Set(storedDismissed));
    }
    // Reset the initial load flag whenever the user changes.
    isInitialLoad.current = true;
  }, [readStorageKey, dismissedStorageKey]);

  useEffect(() => {
    if (!user) {
      setAllActiveNotifications([]);
      isInitialLoad.current = true; // Ensure reset on logout
      return;
    }

    const q = query(
        collection(db, "notifications"),
        where("active", "==", true),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      
      // Use a functional state update to safely compare old and new states and prevent race conditions.
      setAllActiveNotifications(prevNotifications => {
        if (isInitialLoad.current) {
          // This is the first fetch, so we just load the data without triggering animations.
          isInitialLoad.current = false;
        } else {
          // For subsequent updates, check if a truly new notification has been added.
          const newNotificationExists = notificationsData.some(newNotif => 
            !prevNotifications.some(oldNotif => oldNotif.id === newNotif.id)
          );
          
          if (newNotificationExists) {
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1500); // Duration of ring animation
          }
        }
        // Always return the latest data from Firestore.
        return notificationsData;
      });
    });

    return () => unsubscribe();
  }, [user]);

  const notifications = useMemo(() => {
    return allActiveNotifications.filter(n => !dismissedIds.has(n.id));
  }, [allActiveNotifications, dismissedIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const markAllAsRead = useCallback(() => {
    if (!readStorageKey) return;
    const allIds = notifications.map(n => n.id);
    const newReadIds = new Set([...readIds, ...allIds]);
    setReadIds(newReadIds);
    localStorage.setItem(readStorageKey, JSON.stringify(Array.from(newReadIds)));
  }, [notifications, readIds, readStorageKey]);

  const dismissNotification = useCallback((id: string) => {
    if (!dismissedStorageKey) return;
    const newDismissedIds = new Set(dismissedIds).add(id);
    setDismissedIds(newDismissedIds);
    localStorage.setItem(dismissedStorageKey, JSON.stringify(Array.from(newDismissedIds)));
  }, [dismissedIds, dismissedStorageKey]);

  const clearAllNotifications = useCallback(() => {
    if (!dismissedStorageKey) return;
    const allIds = notifications.map(n => n.id);
    const newDismissedIds = new Set([...dismissedIds, ...allIds]);
    setDismissedIds(newDismissedIds);
    localStorage.setItem(dismissedStorageKey, JSON.stringify(Array.from(newDismissedIds)));
  }, [notifications, dismissedIds, dismissedStorageKey]);
  
  const toggleReadStatus = useCallback((id: string) => {
    if (!readStorageKey) return;
    const newReadIds = new Set(readIds);
    if (newReadIds.has(id)) {
      newReadIds.delete(id);
    } else {
      newReadIds.add(id);
    }
    setReadIds(newReadIds);
    localStorage.setItem(readStorageKey, JSON.stringify(Array.from(newReadIds)));
  }, [readIds, readStorageKey]);


  const value = {
    notifications,
    unreadCount,
    readIds,
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
