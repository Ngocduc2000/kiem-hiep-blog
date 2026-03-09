import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { readChapter } from '../services/api';

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

export default function ChapterReadPage() {
  const { id, chapterNumber } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(17);

  useEffect(() => {
    setLoading(true);
    readChapter(id, parseInt(chapterNumber))
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [id, chapterNumber]);

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
    </div>
  );
}
