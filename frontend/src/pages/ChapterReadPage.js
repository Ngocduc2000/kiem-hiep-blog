import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { readChapter } from '../services/api';

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function AudioBar({ text }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const uttRef = useRef(null);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const viVoices = all.filter(v => v.lang.startsWith('vi'));
      setVoices(viVoices.length > 0 ? viVoices : all);
      // Ưu tiên: Google tiếng Việt > bất kỳ giọng Việt > giọng đầu tiên
      const googleVi = viVoices.find(v => v.name.toLowerCase().includes('google'));
      const best = googleVi || viVoices[0] || all[0];
      setVoice(best || null);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  // Stop when text changes (chapter navigation)
  useEffect(() => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }, [text]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  const speak = useCallback(() => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (voice) utt.voice = voice;
    utt.rate = speed;
    utt.lang = voice?.lang || 'vi-VN';
    utt.onend = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setPlaying(true);
  }, [text, voice, speed]);

  const toggle = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
    } else {
      speak();
    }
  };

  const handleSpeed = (s) => {
    setSpeed(s);
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      // restart with new speed after state update
      setTimeout(() => {
        const utt = new SpeechSynthesisUtterance(text);
        if (voice) utt.voice = voice;
        utt.rate = s;
        utt.lang = voice?.lang || 'vi-VN';
        utt.onend = () => setPlaying(false);
        utt.onerror = () => setPlaying(false);
        window.speechSynthesis.speak(utt);
        setPlaying(true);
      }, 100);
    }
  };

  if (!('speechSynthesis' in window)) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 16px', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 8,
      marginBottom: 20,
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🔊 Sách nói:</span>

      <button className="btn btn-primary btn-sm" onClick={toggle} style={{ minWidth: 80 }}>
        {playing ? '⏸ Dừng' : '▶ Nghe'}
      </button>

      {playing && (
        <button className="btn btn-ghost btn-sm" onClick={stop}>⏹ Stop</button>
      )}

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tốc độ:</span>
        {[0.75, 1, 1.25, 1.5, 2].map(s => (
          <button key={s} className={`btn btn-sm ${speed === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => handleSpeed(s)}
            style={{ padding: '3px 7px', fontSize: 11 }}>
            {s}x
          </button>
        ))}
      </div>

      {voices.length > 1 && (
        <select
          className="form-select"
          style={{ fontSize: 12, padding: '3px 8px', height: 28, width: 'auto', maxWidth: 160 }}
          value={voice?.name || ''}
          onChange={e => {
            const v = voices.find(v => v.name === e.target.value);
            setVoice(v);
            if (playing) { stop(); }
          }}
        >
          {voices.map(v => (
            <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
          ))}
        </select>
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
