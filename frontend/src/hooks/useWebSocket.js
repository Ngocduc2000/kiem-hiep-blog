import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const stompClient = useRef(null);
  const messageListeners = useRef(new Map());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connect = () => {
      const socket = new SockJS(`${process.env.REACT_APP_API_URL || ''}/ws`);
      stompClient.current = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
          setIsConnected(true);
        },
        onStompError: (error) => {
          console.error('WebSocket connection failed:', error);
          setIsConnected(false);
          // Retry connection after 5 seconds
          setTimeout(connect, 5000);
        },
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      stompClient.current.activate();
    };

    connect();

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
        setIsConnected(false);
      }
    };
  }, []);

  const subscribe = (conversationId, userId, onMessage) => {
    if (!stompClient.current || !stompClient.current.active) {
      console.warn('WebSocket not connected');
      return () => {};
    }

    const subscription = stompClient.current.subscribe(
      `/user/${userId}/queue/messages/${conversationId}`,
      (message) => {
        try {
          const data = JSON.parse(message.body);
          onMessage(data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      }
    );

    // Store subscription for cleanup
    const key = `${conversationId}-${userId}`;
    messageListeners.current.set(key, subscription);

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      messageListeners.current.delete(key);
    };
  };

  const subscribeReadStatus = (conversationId, userId, onReadStatus) => {
    if (!stompClient.current || !stompClient.current.active) {
      console.warn('WebSocket not connected');
      return () => {};
    }

    const subscription = stompClient.current.subscribe(
      `/user/${userId}/queue/read-status/${conversationId}`,
      (message) => {
        try {
          const data = JSON.parse(message.body);
          onReadStatus(data);
        } catch (e) {
          console.error('Failed to parse read status:', e);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = (conversationId, message) => {
    if (!stompClient.current || !stompClient.current.active) {
      console.warn('WebSocket not connected');
      return;
    }

    stompClient.current.publish({
      destination: `/app/chat/send/${conversationId}`,
      body: JSON.stringify(message),
    });
  };

  const markAsRead = (conversationId) => {
    if (!stompClient.current || !stompClient.current.active) {
      console.warn('WebSocket not connected');
      return;
    }

    stompClient.current.publish({
      destination: `/app/chat/read/${conversationId}`,
      body: '{}',
    });
  };

  return {
    isConnected,
    subscribe,
    subscribeReadStatus,
    sendMessage,
    markAsRead,
  };
};
