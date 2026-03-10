import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getStories } from '../services/api';

export default function StoryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getStories({ page, size: 12, q: q || undefined, status: status || undefined })
      .then(res => {
        setStories(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      })
      .finally(() => setLoading(false));
  }, [page, q, status]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setQ(searchInput);
    setSearchParams(searchInput ? { q: searchInput } : {});
  };

  const handleStatus = (s) => {
    setStatus(s);
    setPage(0);
  };

  return (
    <div className="container" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, color: 'var(--accent)', fontFamily: "'Cinzel Decorative', serif" }}>
          ⚔ Thư Viện Truyện
        </h1>
      </div>

      {/* Search + Filter */}
      <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            style={{ flex: 1, fontSize: 14 }}
            placeholder="Tìm theo tên truyện, tác giả..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">🔍 Tìm</button>
          {q && (
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => { setSearchInput(''); setQ(''); setPage(0); setSearchParams({}); }}>✕</button>
          )}
        </form>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['', 'Tất cả'], ['ONGOING', '🔄 Đang ra'], ['COMPLETED', '✅ Hoàn thành']].map(([val, label]) => (
            <button key={val} className={`btn btn-sm ${status === val ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleStatus(val)}>{label}</button>
          ))}
        </div>
        {(q || status) && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {totalElements} kết quả{q ? ` cho "${q}"` : ''}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
      ) : stories.length === 0 ? (
        <div className="notice notice-info">📭 Không tìm thấy truyện nào.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {stories.map(story => (
            <Link to={`/stories/${story.id}`} key={story.id} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, overflow: 'hidden', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg-tertiary)', overflow: 'hidden', position: 'relative' }}>
                  {story.coverImage ? (
                    <img src={story.coverImage} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, background: 'linear-gradient(135deg, #1a1500, #0d0d0f)' }}>⚔</div>
                  )}
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    background: story.status === 'COMPLETED' ? 'var(--green)' : 'var(--accent)',
                    color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3
                  }}>
                    {story.status === 'COMPLETED' ? 'Hoàn' : 'Đang ra'}
                  </div>
                </div>
                <div style={{ padding: '10px 10px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{story.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{story.author}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    📖 {story.totalChapters} ch · 👁 {(story.viewCount || 0).toLocaleString()}
                  </div>
                  {story.ratingCount > 0 && (
                    <div style={{ fontSize: 11, color: '#f5a623', marginTop: 2 }}>
                      {'★'.repeat(Math.round(story.averageRating))}{'☆'.repeat(5 - Math.round(story.averageRating))} {story.averageRating}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 24 }}>
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
