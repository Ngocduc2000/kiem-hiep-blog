import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStories } from '../services/api';

export default function StoryListPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setLoading(true);
    getStories({ page, size: 12 })
      .then(res => {
        setStories(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="container" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: 'var(--accent)', fontFamily: "'Cinzel Decorative', serif" }}>
          ⚔ Thư Viện Truyện
        </h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
      ) : stories.length === 0 ? (
        <div className="notice notice-info">📭 Chưa có truyện nào được đăng tải.</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16
        }}>
          {stories.map(story => (
            <Link to={`/stories/${story.id}`} key={story.id} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, overflow: 'hidden', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: '100%', aspectRatio: '2/3', background: 'var(--bg-tertiary)',
                  overflow: 'hidden', position: 'relative'
                }}>
                  {story.coverImage ? (
                    <img src={story.coverImage} alt={story.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 40, background: 'linear-gradient(135deg, #1a1500, #0d0d0f)'
                    }}>⚔</div>
                  )}
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    background: story.status === 'COMPLETED' ? 'var(--green)' : 'var(--accent)',
                    color: '#000', fontSize: 10, fontWeight: 700,
                    padding: '2px 6px', borderRadius: 3
                  }}>
                    {story.status === 'COMPLETED' ? 'Hoàn' : 'Đang ra'}
                  </div>
                </div>
                <div style={{ padding: '10px 10px 12px' }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13, color: 'var(--text-primary)',
                    lineHeight: 1.4, marginBottom: 4,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>{story.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{story.author}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    📖 {story.totalChapters} chương · 👁 {story.viewCount}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`page-btn ${i === page ? 'active' : ''}`}
              onClick={() => setPage(i)}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
