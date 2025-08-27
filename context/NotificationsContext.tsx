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
    isInitialLoad.current = true;
  }, [readStorageKey, dismissedStorageKey]);

  useEffect(() => {
    if (!user) {
      setAllActiveNotifications([]);
      return;
    }

    const q = query(
        collection(db, "notifications"),
        where("active", "==", true),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      
      if (!isInitialLoad.current && notificationsData.length > allActiveNotifications.length) {
         setHasNewNotification(true);
         setTimeout(() => setHasNewNotification(false), 1500); // Duration of animation
      }
      
      setAllActiveNotifications(notificationsData);
      isInitialLoad.current = false;
    });

    return () => unsubscribe();
  }, [user, allActiveNotifications.length]);

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

  const value = {
    notifications,
    unreadCount,
    readIds,
    hasNewNotification,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
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
