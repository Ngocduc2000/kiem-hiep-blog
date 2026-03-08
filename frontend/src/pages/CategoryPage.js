import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getTopics, getCategories } from '../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

function TopicRow({ topic }) {
  return (
    <div className={`topic-row ${topic.pinned ? 'pinned' : ''} ${topic.hot ? 'hot' : ''}`}>
      <span className="topic-icon">{topic.pinned ? '📌' : topic.hot ? '🔥' : topic.locked ? '🔒' : '💬'}</span>
      <div className="topic-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link to={`/topic/${topic.id}`} className="topic-title-link">
            {topic.title}
          </Link>
          <div className="topic-badges">
            {topic.pinned && <span className="badge badge-pinned">Ghim</span>}
            {topic.hot && <span className="badge badge-hot">Hot</span>}
            {topic.locked && <span className="badge badge-locked">Khóa</span>}
          </div>
        </div>
        <div className="topic-meta">
          bởi <span style={{ color: 'var(--text-secondary)' }}>{topic.authorName}</span>
          {' · '}
          {format(new Date(topic.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
          {topic.lastReplyAt && (
            <> · phản hồi: {format(new Date(topic.lastReplyAt), 'dd/MM HH:mm', { locale: vi })}</>
          )}
        </div>
        {topic.tags?.length > 0 && (
          <div style={{ marginTop: 3 }}>
            {topic.tags.map(t => (
              <span key={t} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 3, fontSize: 10, marginRight: 4 }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="topic-stats">
        <span>👁 {topic.viewCount}</span>
        <span>💬 {topic.replyCount}</span>
        <span>❤️ {topic.likeCount}</span>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isApproved } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(res => {
      const cat = res.data.find(c => c.id === id);
      setCategory(cat);
    });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    getTopics({ categoryId: id, page, size: 20 })
      .then(res => {
        setTopics(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .finally(() => setLoading(false));
  }, [id, page]);

  return (
    <div className="container">
      <div className="page-layout">
        <div className="main-content">
          <div className="breadcrumb" style={{ marginBottom: 8 }}>
            <Link to="/">🏠 Trang chủ</Link>
            <span className="breadcrumb-sep">›</span>
            <span>{category?.icon} {category?.name}</span>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-header">
              <div>
                <span className="card-title">{category?.icon} {category?.name}</span>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{category?.description}</div>
              </div>
              {isApproved() && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/new-topic?cat=${id}`)}>
                  ✏️ Tạo Topic
                </button>
              )}
            </div>
          </div>

          <div className="category-box">
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
            ) : topics.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                Chưa có topic nào trong mục này.{' '}
                {isApproved() && <Link to={`/new-topic?cat=${id}`}>Tạo topic đầu tiên!</Link>}
              </div>
            ) : (
              topics.map(t => <TopicRow key={t.id} topic={t} />)
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`page-btn ${page === i ? 'active' : ''}`} onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
