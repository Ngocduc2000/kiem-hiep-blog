import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getBookmarks, removeBookmark, getHistory, clearHistory } from '../services/api';

export default function UserLibraryPage() {
  const [tab, setTab] = useState('bookmarks');
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    if (tab === 'bookmarks') {
      getBookmarks()
        .then(res => setBookmarks(res.data || []))
        .finally(() => setLoading(false));
    } else {
      getHistory({ page: historyPage, size: 20 })
        .then(res => {
          setHistory(res.data || []);
          setHistoryTotal(res.data?.length || 0);
        })
        .finally(() => setLoading(false));
    }
  }, [tab, historyPage]);

  const handleRemoveBookmark = async (storyId) => {
    await removeBookmark(storyId);
    setBookmarks(prev => prev.filter(b => b.storyId !== storyId));
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Xóa toàn bộ lịch sử đọc?')) return;
    await clearHistory();
    setHistory([]);
  };

  const StoryCard = ({ item, isBookmark }) => (
    <div style={{
      display: 'flex', gap: 14, padding: '12px 14px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, alignItems: 'flex-start'
    }}>
      {/* Cover */}
      <div style={{ width: 56, height: 80, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
        {item.coverImage
          ? <img src={item.coverImage} alt={item.storyTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚔</div>
        }
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}
          className="text-ellipsis">{item.storyTitle}</div>
        {item.author && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>✍️ {item.author}</div>}
        <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 6 }}>
          📖 Chương {item.chapterNumber}{item.chapterTitle ? `: ${item.chapterTitle}` : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          {format(new Date(isBookmark ? item.savedAt : item.readAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm"
            onClick={() => navigate(`/stories/${item.storyId}/chapters/${item.chapterNumber}`)}>
            Đọc tiếp
          </button>
          <Link to={`/stories/${item.storyId}`}>
            <button className="btn btn-ghost btn-sm">Trang truyện</button>
          </Link>
          {isBookmark && (
            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveBookmark(item.storyId)}>
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
      <h2 style={{ fontSize: 18, color: 'var(--accent)', marginBottom: 20 }}>📚 Thư viện của tôi</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'bookmarks', label: '🔖 Đánh dấu' },
          { key: 'history', label: '🕐 Lịch sử đọc' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="btn btn-sm"
            style={{
              borderRadius: '4px 4px 0 0', borderBottom: 'none',
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.key ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Header action */}
      {tab === 'history' && history.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleClearHistory} style={{ color: 'var(--red)' }}>
            🗑 Xóa lịch sử
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>⏳ Đang tải...</div>
      ) : tab === 'bookmarks' ? (
        bookmarks.length === 0
          ? <div className="notice notice-info">Chưa có truyện nào được đánh dấu.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookmarks.map(b => <StoryCard key={b.id} item={b} isBookmark={true} />)}
            </div>
      ) : (
        history.length === 0
          ? <div className="notice notice-info">Chưa có lịch sử đọc.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(h => <StoryCard key={h.id} item={h} isBookmark={false} />)}
            </div>
      )}
    </div>
  );
}
