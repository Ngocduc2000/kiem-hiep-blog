import React from 'react';
import { Link } from 'react-router-dom';
import './ConversationItem.css';

const ConversationItem = ({ conversation, otherParticipant, unreadCount }) => {
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('vi-VN');
  };

  const truncateMessage = (text, length = 50) => {
    return text && text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <Link to={`/chat/${conversation.id}`} className="conversation-item">
      <div className="conversation-avatar">
        {otherParticipant?.avatar ? (
          <img src={otherParticipant.avatar} alt={otherParticipant.username} />
        ) : (
          <div className="avatar-initial">{otherParticipant?.username?.[0]?.toUpperCase() || '?'}</div>
        )}
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </div>
      <div className="conversation-info">
        <div className="conversation-header">
          <h4 className="conversation-name">{otherParticipant?.displayName || otherParticipant?.username}</h4>
          <span className="conversation-time">{formatTime(conversation.updatedAt)}</span>
        </div>
        <p className={`conversation-preview ${unreadCount > 0 ? 'unread' : ''}`}>
          {truncateMessage(conversation.lastMessageContent)}
        </p>
      </div>
    </Link>
  );
};

export default ConversationItem;
