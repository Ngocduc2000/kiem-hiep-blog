import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getHotTopics, getLatestTopics } from '../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

function TopicRow({ topic }) {
  return (
    <div className={`topic-row ${topic.pinned ? 'pinned' : ''} ${topic.hot ? 'hot' : ''}`}>
      <span className="topic-icon">{topic.pinned ? '📌' : topic.hot ? '🔥' : topic.locked ? '🔒' : '💬'}</span>
      <div className="topic-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link to={`/topic/${topic.id}`} className="topic-title-link" style={{ flex: 'none', maxWidth: '100%' }}>
            {topic.title}
          </Link>
          <div className="topic-badges">
            {topic.pinned && <span className="badge badge-pinned">Ghim</span>}
            {topic.hot && <span className="badge badge-hot">Hot</span>}
            {topic.locked && <span className="badge badge-locked">Khóa</span>}
          </div>
        </div>
        <div className="topic-meta">
          bởi <Link to="#">{topic.authorName}</Link>
          {topic.lastReplyAt && (
            <> · trả lời gần nhất bởi <span style={{ color: 'var(--text-secondary)' }}>{topic.lastReplyUsername}</span>{' '}
            {format(new Date(topic.lastReplyAt), 'dd/MM HH:mm', { locale: vi })}</>
          )}
        </div>
      </div>
      <div className="topic-stats">
        <span>👁 {topic.viewCount || 0}</span>
        <span>💬 {topic.replyCount || 0}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [hotTopics, setHotTopics] = useState([]);
  const [latestTopics, setLatestTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isApproved } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCategories(), getHotTopics(), getLatestTopics()])
      .then(([cats, hot, latest]) => {
        setCategories(cats.data);
        setHotTopics(hot.data);
        setLatestTopics(latest.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;

  return (
    <div className="container">
      {user && user.memberStatus === 'PENDING' && (
        <div className="notice notice-warning" style={{ marginTop: 12 }}>
          ⏳ Tài khoản của bạn đang chờ admin phê duyệt. Bạn có thể xem nhưng chưa thể đăng bài.
        </div>
      )}

      <div className="page-layout">
        <div className="main-content">
          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0f 60%, #1a1a0f 100%)',
            border: '1px solid var(--accent)', borderRadius: 8,
            padding: '20px 24px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, color: 'var(--accent)', marginBottom: 4 }}>
                ⚔ Kiếm Hiệp Vô Song
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Diễn đàn bàn luận kiếm hiệp, tiên hiệp hàng đầu Việt Nam
              </div>
            </div>
            {isApproved() && (
              <button className="btn btn-primary" onClick={() => navigate('/new-topic')}>
                ✏️ Tạo Topic Mới
              </button>
            )}
          </div>

          {/* Categories */}
          {categories.map(cat => (
            <div className="category-box" key={cat.id}>
              <div className="category-header">
                <span className="category-icon">{cat.icon}</span>
                <div>
                  <Link to={`/category/${cat.id}`} style={{ textDecoration: 'none' }}>
                    <div className="category-name">{cat.name}</div>
                  </Link>
                  <div className="category-desc">{cat.description}</div>
                </div>
                <div className="category-stats">
                  <div>{cat.topicCount || 0} topics</div>
                  <div>{cat.postCount || 0} bài viết</div>
                </div>
              </div>
              {/* Latest 3 topics per category would require extra API, skip for now */}
            </div>
          ))}
        </div>

        <div className="sidebar">
          <div className="sidebar-widget">
            <div className="sidebar-widget-title">🔥 Chủ đề nóng</div>
            {hotTopics.length === 0 && (
              <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>Chưa có chủ đề</div>
            )}
            {hotTopics.map(t => (
              <div className="sidebar-topic-item" key={t.id}>
                <Link to={`/topic/${t.id}`}>{t.title}</Link>
                <div className="sidebar-topic-meta">👁 {t.viewCount} · 💬 {t.replyCount}</div>
              </div>
            ))}
          </div>

          <div className="sidebar-widget">
            <div className="sidebar-widget-title">🆕 Mới nhất</div>
            {latestTopics.length === 0 && (
              <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>Chưa có chủ đề</div>
            )}
            {latestTopics.map(t => (
              <div className="sidebar-topic-item" key={t.id}>
                <Link to={`/topic/${t.id}`}>{t.title}</Link>
                <div className="sidebar-topic-meta">
                  {t.createdAt ? format(new Date(t.createdAt), 'dd/MM/yyyy', { locale: vi }) : ''}
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-widget">
            <div className="sidebar-widget-title">ℹ️ Thông tin</div>
            <div style={{ padding: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>📖 Bàn luận văn học, truyện kiếm hiệp</div>
              <div>🚫 Không spam, không vi phạm</div>
              <div>✅ Thành viên cần được duyệt</div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                {user ? (
                  <span style={{ color: 'var(--green)' }}>✅ Đã đăng nhập</span>
                ) : (
                  <Link to="/register" style={{ color: 'var(--accent)' }}>👉 Đăng ký ngay</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
