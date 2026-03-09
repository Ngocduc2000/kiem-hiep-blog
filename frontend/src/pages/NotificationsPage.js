import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const TYPE_ICON = {
  REPLY: '💬',
  APPROVE_USER: '✅',
  REJECT_USER: '❌',
  APPROVE_TOPIC: '✅',
  REJECT_TOPIC: '❌',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { clearUnread } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getNotifications({ page, size: 20 }).then(res => {
      setNotifications(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    }).finally(() => setLoading(false));
  }, [page]);

  const handleClick = async (n) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.link) navigate(n.link);
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    clearUnread();
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, color: 'var(--accent)' }}>🔔 Thông báo</h2>
        <button className="btn btn-ghost btn-sm" onClick={handleReadAll}>Đánh dấu tất cả đã đọc</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>⏳ Đang tải...</div>
      ) : notifications.length === 0 ? (
        <div className="notice notice-info">Chưa có thông báo nào.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifications.map(n => (
            <div key={n.id} onClick={() => handleClick(n)}
              style={{
                padding: '12px 16px', borderRadius: 6, cursor: n.link ? 'pointer' : 'default',
                background: n.read ? 'var(--bg-card)' : 'var(--accent-dim)',
                border: `1px solid ${n.read ? 'var(--border)' : 'var(--accent)'}`,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[n.type] || '🔔'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: n.read ? 400 : 600, color: 'var(--text-primary)', fontSize: 14 }}>{n.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{n.message}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                  {n.createdAt && format(new Date(n.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 16 }}>
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button key={i} className={`page-btn ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
