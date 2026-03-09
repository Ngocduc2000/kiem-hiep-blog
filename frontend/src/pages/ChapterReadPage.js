import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { readChapter } from '../services/api';

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
        gap: 12, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)'
      }}>
        <span>Cỡ chữ:</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setFontSize(s => Math.max(13, s - 1))}>A-</button>
        <span style={{ minWidth: 30, textAlign: 'center' }}>{fontSize}px</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setFontSize(s => Math.min(24, s + 1))}>A+</button>
      </div>

      {/* Nav top */}
      <NavButtons />

      {/* Content */}
      <div style={{
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
