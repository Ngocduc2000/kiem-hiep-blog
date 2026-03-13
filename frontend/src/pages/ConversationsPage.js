import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import ConversationItem from '../components/ConversationItem';
import './ConversationsPage.css';

const ConversationsPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, [page]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.getConversations({ page, size: 20 });
      if (page === 0) {
        setConversations(response.data.content || []);
      } else {
        setConversations(prev => [...prev, ...(response.data.content || [])]);
      }
      setHasMore(response.data.content?.length === 20);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('Không thể tải cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant1Id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant2Id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.lastMessageContent && conv.lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="conversations-page">
      <div className="conversations-container">
        <div className="conversations-header">
          <h1>💬 Tin nhắn</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Tìm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="conversations-list">
          {error && <div className="error-message">{error}</div>}

          {loading && page === 0 ? (
            <div className="loading">Đang tải...</div>
          ) : filteredConversations.length > 0 ? (
            <>
              {filteredConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  otherParticipant={{
                    username: conv.participant1Id === localStorage.getItem('userId') ? conv.participant2Id : conv.participant1Id,
                    displayName: conv.participant1Id === localStorage.getItem('userId') ? conv.participant2Id : conv.participant1Id,
                  }}
                  unreadCount={0}
                />
              ))}
              {hasMore && (
                <button className="load-more-btn" onClick={handleLoadMore} disabled={loading}>
                  {loading ? 'Đang tải...' : 'Tải thêm'}
                </button>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>📭 Chưa có cuộc trò chuyện nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
