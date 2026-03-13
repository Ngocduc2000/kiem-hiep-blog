import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { readChapter, getChapterComments, addChapterComment, toggleBookmark, removeBookmark, checkBookmark, recordHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LevelBadge, { getLevelInfo } from '../components/LevelBadge';

const API = process.env.REACT_APP_API_URL || '';

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Split into chunks ≤150 chars at sentence boundaries
function splitChunks(text, max = 150) {
  const sentences = text.replace(/\n+/g, ' ').split(/(?<=[.!?,;])\s+/);
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if (!s.trim()) continue;
    if ((cur + ' ' + s).trim().length > max) {
      if (cur) chunks.push(cur.trim());
      // if single sentence too long, split by word
      if (s.length > max) {
        const words = s.split(' ');
        let part = '';
        for (const w of words) {
          if ((part + ' ' + w).trim().length > max) {
            if (part) chunks.push(part.trim());
            part = w;
          } else {
            part = (part + ' ' + w).trim();
          }
        }
        if (part) cur = part;
        else cur = '';
      } else {
        cur = s;
      }
    } else {
      cur = (cur + ' ' + s).trim();
    }
  }
  if (cur) chunks.push(cur.trim());
  return chunks.filter(c => c.length > 0);
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function AudioBar({ text }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [chunks, setChunks] = useState([]);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);
  const stoppedRef = useRef(false);
  const speedRef = useRef(1);

  useEffect(() => {
    stop();
    setChunks(splitChunks(text));
    setChunkIdx(0);
  }, [text]); // eslint-disable-line

  const stop = () => {
    stoppedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlaying(false);
    setLoading(false);
  };

  const playFrom = async (allChunks, idx) => {
    if (stoppedRef.current || idx >= allChunks.length) {
      setPlaying(false);
      setLoading(false);
      setChunkIdx(0);
      return;
    }
    setChunkIdx(idx);
    setLoading(true);
    const url = `${API}/api/tts?text=${encodeURIComponent(allChunks[idx])}`;
    const audio = new Audio(url);
    audio.playbackRate = speedRef.current;
    audioRef.current = audio;
    audio.oncanplay = () => setLoading(false);
    audio.onended = () => {
      if (!stoppedRef.current) playFrom(allChunks, idx + 1);
    };
    audio.onerror = () => {
      if (!stoppedRef.current) playFrom(allChunks, idx + 1);
    };
    try { await audio.play(); } catch { /* blocked */ }
  };

  const toggle = () => {
    if (playing) {
      stop();
    } else {
      stoppedRef.current = false;
      const c = splitChunks(text);
      setChunks(c);
      setPlaying(true);
      playFrom(c, chunkIdx);
    }
  };

  const handleStop = () => {
    stop();
    setChunkIdx(0);
  };

  const handleSpeed = (s) => {
    setSpeed(s);
    speedRef.current = s;
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 16px', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 8,
      marginBottom: 20,
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🔊 Sách nói:</span>

      <button className="btn btn-primary btn-sm" onClick={toggle} style={{ minWidth: 90 }}
        disabled={loading}>
        {loading ? '⏳ Đang tải...' : playing ? '⏸ Tạm dừng' : '▶ Nghe'}
      </button>

      {(playing || chunkIdx > 0) && (
        <button className="btn btn-ghost btn-sm" onClick={handleStop}>⏹ Dừng</button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tốc độ:</span>
        {SPEEDS.map(s => (
          <button key={s} onClick={() => handleSpeed(s)}
            className={`btn btn-sm ${speed === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 7px', fontSize: 11 }}>
            {s}x
          </button>
        ))}
      </div>

      {chunks.length > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {chunkIdx + 1}/{chunks.length}
        </span>
      )}
    </div>
  );
}

function CommentSection({ storyId, chapterNumber }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback((p = 0) => {
    setLoading(true);
    getChapterComments(storyId, chapterNumber, { page: p, size: 20 })
      .then(res => {
        setComments(res.data.content || []);
        setTotal(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 0);
        setPage(p);
      })
      .finally(() => setLoading(false));
  }, [storyId, chapterNumber]);

  useEffect(() => { load(0); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await addChapterComment(storyId, chapterNumber, { content });
      setComments(prev => [res.data, ...prev]);
      setTotal(t => t + 1);
      setContent('');
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        💬 Bình luận ({total})
      </h3>

      {/* Form */}
      {user ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>
              {(user.displayName || user.username)?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Nhập bình luận của bạn..."
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{ resize: 'vertical', fontSize: 14 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !content.trim()}>
                  {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Đăng nhập</Link> để bình luận
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 16, textAlign: 'center' }}>⏳ Đang tải...</div>
      ) : comments.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Chưa có bình luận nào. Hãy là người đầu tiên!</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10 }}>
              <div className="avatar" onClick={() => navigate(`/profile/${c.username}`)} style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0, cursor: 'pointer' }}>
                {(c.displayName || c.username)?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span onClick={() => navigate(`/profile/${c.username}`)} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>{c.displayName || c.username}</span>
                  {c.level && <LevelBadge exp={c.exp || 0} size="sm" />}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {c.createdAt && format(new Date(c.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  {c.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 16 }}>
          <button className="page-btn" disabled={page === 0} onClick={() => load(page - 1)}>‹</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button key={i} className={`page-btn ${i === page ? 'active' : ''}`} onClick={() => load(i)}>{i + 1}</button>
          ))}
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>›</button>
        </div>
      )}
    </div>
  );
}

export default function ChapterReadPage() {
  const { id, chapterNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(17);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setLoading(true);
    readChapter(id, parseInt(chapterNumber))
      .then(res => {
        setData(res.data);
        if (user) {
          checkBookmark(id).then(r => setBookmarked(r.data.bookmarked)).catch(() => {});
          recordHistory({
            storyId: id,
            storyTitle: res.data.storyTitle,
            coverImage: '',
            author: '',
            chapterNumber: parseInt(chapterNumber),
            chapterTitle: res.data.chapter.title
          }).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [id, chapterNumber]); // eslint-disable-line

  const handleBookmark = async () => {
    try {
      if (bookmarked) {
        await removeBookmark(id);
        setBookmarked(false);
      } else {
        await toggleBookmark({
          storyId: id,
          storyTitle: data.storyTitle,
          coverImage: '',
          author: '',
          chapterNumber: parseInt(chapterNumber),
          chapterTitle: data.chapter.title
        });
        setBookmarked(true);
      }
    } catch {} // eslint-disable-line
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải chương...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Không tìm thấy chương</div>;

  const { chapter, hasPrev, hasNext, storyTitle } = data;
  const num = parseInt(chapterNumber);
  const plainText = stripHtml(chapter.content || '');

  const NavButtons = () => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link to={`/stories/${id}`}>
        <button className="btn btn-ghost btn-sm">📚 Mục lục</button>
      </Link>
      <button className="btn btn-ghost btn-sm" disabled={!hasPrev}
        onClick={() => hasPrev && navigate(`/stories/${id}/chapters/${num - 1}`)}>
        ← Chương trước
      </button>
      <button className="btn btn-primary btn-sm" disabled={!hasNext}
        onClick={() => hasNext && navigate(`/stories/${id}/chapters/${num + 1}`)}>
        Chương sau →
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '20px 16px' }}>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/stories">Thư viện</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={`/stories/${id}`}>{storyTitle}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Chương {chapter.chapterNumber}</span>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '24px 0 20px' }}>
        <h1 style={{
          fontSize: 18, color: 'var(--accent)', fontFamily: "'Be Vietnam Pro', sans-serif",
          fontWeight: 700, marginBottom: 6
        }}>
          {storyTitle}
        </h1>
        <h2 style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
          Chương {chapter.chapterNumber}: {chapter.title}
        </h2>
        {chapter.wordCount > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {chapter.wordCount.toLocaleString()} chữ
          </div>
        )}
        {user && (
          <button
            className={`btn btn-sm ${bookmarked ? 'btn-primary' : 'btn-ghost'}`}
            style={{ marginTop: 8 }}
            onClick={handleBookmark}
          >
            {bookmarked ? '🔖 Đã đánh dấu' : '🔖 Đánh dấu'}
          </button>
        )}
      </div>

      {/* Font size controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)'
      }}>
        <span>Cỡ chữ:</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setFontSize(s => Math.max(13, s - 1))}>A-</button>
        <span style={{ minWidth: 30, textAlign: 'center' }}>{fontSize}px</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setFontSize(s => Math.min(24, s + 1))}>A+</button>
      </div>

      {/* Audio bar */}
      <AudioBar text={plainText} />

      {/* Nav top */}
      <NavButtons />

      {/* Content */}
      <div className="chapter-content" style={{
        margin: '28px 0',
        padding: '28px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: fontSize,
        lineHeight: 2,
        color: 'var(--text-primary)',
        fontFamily: "'Lora', 'Be Vietnam Pro', serif",
        letterSpacing: '0.02em',
      }}
        dangerouslySetInnerHTML={{ __html: chapter.content }}
      />

      {/* Nav bottom */}
      <NavButtons />

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to={`/stories/${id}`} style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          ← Quay lại trang truyện
        </Link>
      </div>

      {/* Comments */}
      <CommentSection storyId={id} chapterNumber={num} />
    </div>
  );
}
