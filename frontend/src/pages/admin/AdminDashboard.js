import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { adminGetStats, adminGetMemberStats } from '../../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name === 'topics' ? '📋 Topics' : '💬 Bình luận'}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [memberStats, setMemberStats] = useState([]);

  useEffect(() => {
    adminGetStats().then(res => setStats(res.data));
    adminGetMemberStats().then(res => setMemberStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;

  const cards = [
    { label: 'Tổng thành viên', value: stats.totalUsers, icon: '👥' },
    { label: 'Chờ duyệt (User)', value: stats.pendingUsers, icon: '⏳', highlight: stats.pendingUsers > 0 },
    { label: 'Tổng Topics', value: stats.totalTopics, icon: '📋' },
    { label: 'Chờ duyệt (Topic)', value: stats.pendingTopics, icon: '📝', highlight: stats.pendingTopics > 0 },
    { label: 'Tổng Bài viết', value: stats.totalPosts, icon: '💬' },
    { label: 'Chờ duyệt (Post)', value: stats.pendingPosts, icon: '🔔', highlight: stats.pendingPosts > 0 },
    { label: 'Báo cáo chờ xử lý', value: stats.pendingReports ?? 0, icon: '🚩', highlight: stats.pendingReports > 0 },
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

      {memberStats.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <span className="card-title">📈 Thống kê bài viết & bình luận theo thành viên</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Top {memberStats.length} thành viên tích cực</span>
          </div>
          <div style={{ padding: '20px 8px 12px' }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={memberStats} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => value === 'topics' ? 'Topics' : 'Bình luận'}
                  wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 13, paddingTop: 12 }}
                />
                <Bar dataKey="topics" name="topics" fill="#c8960c" radius={[3, 3, 0, 0]} />
                <Bar dataKey="posts" name="posts" fill="#4a9eff" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {memberStats.length === 0 && (
        <div className="notice notice-info" style={{ marginTop: 20 }}>
          📭 Chưa có dữ liệu thành viên để hiển thị biểu đồ.
        </div>
      )}

      <div className="notice notice-info" style={{ marginTop: 16 }}>
        💡 Kiểm tra tab <strong>Quản lý thành viên</strong> và <strong>Phê duyệt bài đăng</strong> để xử lý các mục đang chờ.
      </div>
    </div>
  );
}
