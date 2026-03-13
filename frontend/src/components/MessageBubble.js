import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && message.senderAvatar && (
        <img src={message.senderAvatar} alt={message.senderName} className="message-avatar" />
      )}
      <div className="message-content">
        {!isOwn && <div className="message-sender">{message.senderName}</div>}
        <div className="message-text">{message.content}</div>
        <div className="message-time">
          {formatTime(message.createdAt)}
          {isOwn && message.read && <span className="read-status">✓✓</span>}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
