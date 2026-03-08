import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchTopics } from '../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    searchTopics(q, { page, size: 20 })
      .then(res => {
        setResults(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .finally(() => setLoading(false));
  }, [q, page]);

  return (
    <div className="container">
      <div style={{ maxWidth: 900, margin: '20px auto' }}>
        <div className="card-header" style={{ marginBottom: 12, background: 'none', border: 'none', padding: 0 }}>
          <h2 style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
            🔍 Kết quả tìm kiếm: <span style={{ color: 'var(--accent)' }}>{q}</span>
          </h2>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tìm...</div>
        ) : results.length === 0 ? (
          <div className="notice notice-info">Không tìm thấy kết quả nào cho "{q}".</div>
        ) : (
          <div className="category-box">
            {results.map(t => (
              <div className="topic-row" key={t.id}>
                <span className="topic-icon">💬</span>
                <div className="topic-info">
                  <Link to={`/topic/${t.id}`} className="topic-title-link">{t.title}</Link>
                  <div className="topic-meta">
                    bởi {t.authorName} · {t.createdAt ? format(new Date(t.createdAt), 'dd/MM/yyyy', { locale: vi }) : ''}
                  </div>
                </div>
                <div className="topic-stats">
                  <span>👁 {t.viewCount}</span>
                  <span>💬 {t.replyCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
  );
}
