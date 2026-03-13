import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import MessageBubble from '../components/MessageBubble';
import './ChatPage.css';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { isConnected, sendMessage, markAsRead, subscribe } = useWebSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const messagesEndRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
      navigate('/login');
      return;
    }
    setCurrentUserId(userId);
    fetchConversation();
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await api.getConversation(conversationId);
      setConversation(response.data);
      await fetchMessages();
      setError(null);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
      setError('Không thể tải cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.getMessages(conversationId, { page: 0, size: 50 });
      setMessages(response.data.content || response.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    if (!isConnected || !conversationId || !currentUserId) return;

    const unsubscribe = subscribe(conversationId, currentUserId, (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Mark conversation as read
    markAsRead(conversationId);

    return unsubscribe;
  }, [isConnected, conversationId, currentUserId, subscribe, markAsRead]);

  useEffect(() => {
    // Scroll to bottom with debouncing
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    try {
      setSending(true);
      if (isConnected) {
        sendMessage(conversationId, { content: messageContent });
      } else {
        await api.sendMessage(conversationId, { content: messageContent });
        await fetchMessages();
      }
      setMessageContent('');
      setError(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      try {
        await api.deleteConversation(conversationId);
        navigate('/conversations');
      } catch (err) {
        console.error('Failed to delete conversation:', err);
        setError('Không thể xóa cuộc trò chuyện');
      }
    }
  };

  if (loading) {
    return <div className="chat-loading">Đang tải...</div>;
  }

  if (!conversation) {
    return <div className="chat-error">Không tìm thấy cuộc trò chuyện</div>;
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <button className="back-btn" onClick={() => navigate('/conversations')}>
            ← Quay lại
          </button>
          <h2 className="chat-title">
            {conversation.participant1Id === currentUserId
              ? conversation.participant2Id
              : conversation.participant1Id}
          </h2>
          <button className="delete-btn" onClick={handleDeleteConversation}>
            🗑️
          </button>
        </div>

        <div className="messages-container">
          {error && <div className="error-message">{error}</div>}

          {messages.length === 0 ? (
            <div className="empty-messages">
              <p>Bắt đầu cuộc trò chuyện mới</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="message-input"
            disabled={sending}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={sending || !messageContent.trim()}
          >
            {sending ? 'Đang gửi...' : '📤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
