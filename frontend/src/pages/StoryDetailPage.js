import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStory } from '../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function StoryDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    getStory(id).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Không tìm thấy truyện</div>;

  const { story, chapters } = data;
  const displayChapters = showAllChapters ? chapters : chapters.slice(0, 50);

  return (
    <div className="container" style={{ padding: '20px 16px', maxWidth: 900 }}>
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/stories">Thư viện</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{story.title}</span>
      </div>

      {/* Story info */}
      <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 160, height: 240, background: 'var(--bg-tertiary)',
            borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)'
          }}>
            {story.coverImage ? (
              <img src={story.coverImage} alt={story.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 50,
                background: 'linear-gradient(135deg, #1a1500, #0d0d0f)'
              }}>⚔</div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {story.title}
          </h1>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            ✍️ Tác giả: <strong style={{ color: 'var(--accent)' }}>{story.author}</strong>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{
              background: story.status === 'COMPLETED' ? 'rgba(61,186,111,0.2)' : 'rgba(200,150,12,0.2)',
              color: story.status === 'COMPLETED' ? 'var(--green)' : 'var(--accent)',
              padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600
            }}>
              {story.status === 'COMPLETED' ? '✅ Hoàn thành' : '🔄 Đang cập nhật'}
            </span>
            {(story.genres || []).map(g => (
              <span key={g} style={{
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                padding: '3px 10px', borderRadius: 4, fontSize: 12, border: '1px solid var(--border)'
              }}>{g}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            <span>📖 {story.totalChapters} chương</span>
            <span>👁 {story.viewCount.toLocaleString()} lượt đọc</span>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            {story.description}
          </p>

          {chapters.length > 0 && (
            <Link to={`/stories/${id}/chapters/1`}>
              <button className="btn btn-primary" style={{ marginRight: 8 }}>
                📖 Đọc từ đầu
              </button>
            </Link>
          )}
          {chapters.length > 0 && (
            <Link to={`/stories/${id}/chapters/${chapters[chapters.length - 1].chapterNumber}`}>
              <button className="btn btn-ghost">
                ⏭ Chương mới nhất
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Chapter list */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <span className="card-title">📋 Danh sách chương ({chapters.length})</span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}>
          {displayChapters.map((ch, i) => (
            <Link key={ch.id} to={`/stories/${id}/chapters/${ch.chapterNumber}`}
              style={{
                padding: '10px 16px', borderBottom: '1px solid var(--border)',
                color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 30 }}>
                {ch.chapterNumber}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ch.title}
              </span>
              {ch.createdAt && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {format(new Date(ch.createdAt), 'dd/MM', { locale: vi })}
                </span>
              )}
            </Link>
          ))}
        </div>
        {chapters.length > 50 && (
          <div style={{ padding: '12px 16px', textAlign: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAllChapters(s => !s)}>
              {showAllChapters ? 'Thu gọn' : `Xem tất cả ${chapters.length} chương`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
