import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { getUnreadCount } from '../services/api';

const API = process.env.REACT_APP_API_URL || '';
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      if (clientRef.current) { clientRef.current.deactivate(); clientRef.current = null; }
      return;
    }
    // Load initial unread count
    getUnreadCount().then(res => setUnreadCount(res.data.count)).catch(() => {});

    // Connect WebSocket
    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${user.id}/queue/notifications`, (msg) => {
          const notif = JSON.parse(msg.body);
          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(c => c + 1);
        });
      },
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); };
  }, [user]);

  const decrementUnread = () => setUnreadCount(c => Math.max(0, c - 1));
  const clearUnread = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, setNotifications, decrementUnread, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
