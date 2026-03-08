import React, { useEffect, useState } from 'react';
import { adminGetStats } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminGetStats().then(res => setStats(res.data));
  }, []);

  if (!stats) return <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;

  const cards = [
    { label: 'Tổng thành viên', value: stats.totalUsers, icon: '👥' },
    { label: 'Chờ duyệt (User)', value: stats.pendingUsers, icon: '⏳', highlight: stats.pendingUsers > 0 },
    { label: 'Tổng Topics', value: stats.totalTopics, icon: '📋' },
    { label: 'Chờ duyệt (Topic)', value: stats.pendingTopics, icon: '📝', highlight: stats.pendingTopics > 0 },
    { label: 'Tổng Bài viết', value: stats.totalPosts, icon: '💬' },
    { label: 'Chờ duyệt (Post)', value: stats.pendingPosts, icon: '🔔', highlight: stats.pendingPosts > 0 },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, color: 'var(--accent)', marginBottom: 20 }}>📊 Tổng quan hệ thống</h2>
      <div className="stats-grid">
        {cards.map(card => (
          <div key={card.label} className="stat-card" style={card.highlight ? { borderColor: 'var(--accent)' } : {}}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{card.icon}</div>
            <div className="stat-value" style={card.highlight ? { color: 'var(--red)' } : {}}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="notice notice-info">
        💡 Kiểm tra tab <strong>Quản lý thành viên</strong> và <strong>Phê duyệt bài đăng</strong> để xử lý các mục đang chờ.
      </div>
    </div>
  );
}
