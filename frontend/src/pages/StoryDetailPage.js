import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getStory, getStoryChapters, getAllChaptersMeta, rateStory, getMyRating, toggleFollow, getFollowStatus } from '../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PAGE_SIZE = 50;

function StarRating({ storyId, initialRating, averageRating, ratingCount, onRated }) {
  const { user } = useAuth();
  const [hover, setHover] = useState(0);
  const [userRating, setUserRating] = useState(initialRating);

  const handleRate = async (star) => {
    if (!user) { toast.info('Đăng nhập để đánh giá truyện'); return; }
    try {
      const res = await rateStory(storyId, star);
      setUserRating(star);
      onRated(res.data);
      toast.success('Đã đánh giá!');
    } catch { toast.error('Lỗi khi đánh giá'); }
  };

  const display = hover || userRating;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              fontSize: 22, cursor: user ? 'pointer' : 'default',
              color: star <= display ? '#f5a623' : 'var(--border)',
              transition: 'color 0.1s'
            }}
          >★</span>
        ))}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {averageRating > 0 ? `${averageRating} / 5 (${ratingCount} lượt)` : 'Chưa có đánh giá'}
      </span>
    </div>
  );
}

export default function StoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [allMeta, setAllMeta] = useState([]);
  const [chapterPage, setChapterPage] = useState(0);
  const [totalChapterPages, setTotalChapterPages] = useState(0);
  const [chapLoading, setChapLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    getStory(id).then(res => setStory(res.data));
    getAllChaptersMeta(id).then(res => setAllMeta(res.data || []));
    getFollowStatus(id).then(res => {
      setFollowing(res.data.following || false);
      setFollowerCount(res.data.followerCount || 0);
    }).catch(() => {});
    if (user) {
      getMyRating(id).then(res => setMyRating(res.data.rating || 0)).catch(() => {});
    }
  }, [id, user]);

  const handleFollow = async () => {
    if (!user) { toast.info('Đăng nhập để theo dõi truyện'); return; }
    try {
      const res = await toggleFollow(id);
      setFollowing(res.data.following);
      setFollowerCount(res.data.followerCount);
      toast.success(res.data.following ? '🔔 Đang theo dõi truyện!' : 'Đã bỏ theo dõi');
    } catch { toast.error('Lỗi khi theo dõi'); }
  };

  const loadChapters = useCallback(() => {
    setChapLoading(true);
    getStoryChapters(id, { page: chapterPage, size: PAGE_SIZE, q: search || undefined })
      .then(res => {
        setChapters(res.data.content || []);
        setTotalChapterPages(res.data.totalPages || 0);
      })
      .finally(() => setChapLoading(false));
  }, [id, chapterPage, search]);

  useEffect(() => { loadChapters(); }, [loadChapters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setChapterPage(0);
    setSearch(searchInput);
  };

  if (!story) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
  );

  const lastChapter = allMeta.length > 0 ? allMeta[allMeta.length - 1] : null;

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
          <div style={{ width: 160, height: 240, background: 'var(--bg-tertiary)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {story.coverImage
              ? <img src={story.coverImage} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, background: 'linear-gradient(135deg, #1a1500, #0d0d0f)' }}>⚔</div>
            }
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{story.title}</h1>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            ✍️ Tác giả: <strong style={{ color: 'var(--accent)' }}>{story.author}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ background: story.status === 'COMPLETED' ? 'rgba(61,186,111,0.2)' : 'rgba(200,150,12,0.2)', color: story.status === 'COMPLETED' ? 'var(--green)' : 'var(--accent)', padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
              {story.status === 'COMPLETED' ? '✅ Hoàn thành' : '🔄 Đang cập nhật'}
            </span>
            {(story.genres || []).map(g => (
              <span key={g} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 4, fontSize: 12, border: '1px solid var(--border)' }}>{g}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            <span>📖 {story.totalChapters} chương</span>
            <span>👁 {(story.viewCount || 0).toLocaleString()} lượt đọc</span>
          </div>
          <StarRating
            storyId={id}
            initialRating={myRating}
            averageRating={story.averageRating || 0}
            ratingCount={story.ratingCount || 0}
            onRated={(data) => setStory(s => ({ ...s, averageRating: data.averageRating, ratingCount: data.ratingCount }))}
          />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{story.description}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {allMeta.length > 0 && (
              <button className="btn btn-primary" onClick={() => navigate(`/stories/${id}/chapters/1`)}>📖 Đọc từ đầu</button>
            )}
            {lastChapter && (
              <button className="btn btn-ghost" onClick={() => navigate(`/stories/${id}/chapters/${lastChapter.chapterNumber}`)}>⏭ Chương mới nhất</button>
            )}
            <button
              className={`btn btn-sm ${following ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleFollow}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {following ? '🔔 Đang theo dõi' : '🔔 Theo dõi'}
              {followerCount > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>({followerCount})</span>}
            </button>
            {allMeta.length > 0 && (
              <select className="form-select" style={{ width: 'auto', fontSize: 13, minWidth: 180 }} defaultValue=""
                onChange={e => e.target.value && navigate(`/stories/${id}/chapters/${e.target.value}`)}>
                <option value="">⬇ Chọn chương...</option>
                {allMeta.map(ch => (
                  <option key={ch.id} value={ch.chapterNumber}>Ch.{ch.chapterNumber}: {ch.title}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Chapter list with search + pagination */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <span className="card-title">📋 Danh sách chương ({story.totalChapters})</span>
        </div>

        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" style={{ flex: 1, fontSize: 13, padding: '6px 10px' }}
              placeholder="Tìm tên chương..." value={searchInput}
              onChange={e => setSearchInput(e.target.value)} />
            <button type="submit" className="btn btn-ghost btn-sm">🔍 Tìm</button>
            {search && (
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setSearch(''); setSearchInput(''); setChapterPage(0); }}>✕ Xóa</button>
            )}
          </form>
        </div>

        {chapLoading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>⏳</div>
        ) : chapters.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Không tìm thấy chương nào.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {chapters.map(ch => (
              <Link key={ch.id} to={`/stories/${id}/chapters/${ch.chapterNumber}`}
                style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 32, flexShrink: 0 }}>{ch.chapterNumber}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</span>
                {ch.createdAt && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {format(new Date(ch.createdAt), 'dd/MM', { locale: vi })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {totalChapterPages > 1 && (
          <div className="pagination" style={{ padding: '12px 16px' }}>
            <button className="page-btn" disabled={chapterPage === 0} onClick={() => setChapterPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalChapterPages, 10) }, (_, i) => (
              <button key={i} className={`page-btn ${i === chapterPage ? 'active' : ''}`} onClick={() => setChapterPage(i)}>{i + 1}</button>
            ))}
            <button className="page-btn" disabled={chapterPage >= totalChapterPages - 1} onClick={() => setChapterPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
