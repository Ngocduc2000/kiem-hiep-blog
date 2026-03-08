import React, { useEffect, useState } from 'react';
import { adminGetPendingTopics, adminApproveTopic, adminRejectTopic, adminPinTopic, adminLockTopic, adminHotTopic, adminDeleteTopic } from '../../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = () => {
    setLoading(true);
    adminGetPendingTopics({ page, size: 20 })
      .then(res => { setTopics(res.data.content || []); setTotalPages(res.data.totalPages || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const action = async (fn, id, msg) => {
    try { await fn(id); toast.success(msg); load(); }
    catch { toast.error('Lỗi thao tác!'); }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, color: 'var(--accent)', marginBottom: 16 }}>📋 Phê duyệt Topics</h2>
      {loading ? <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div> : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tác giả</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(t => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/topic/${t.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</Link>
                    <div style={{ marginTop: 3 }}>
                      {t.pinned && <span className="badge badge-pinned" style={{ marginRight: 3 }}>Ghim</span>}
                      {t.hot && <span className="badge badge-hot" style={{ marginRight: 3 }}>Hot</span>}
                      {t.locked && <span className="badge badge-locked">Khóa</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.authorName}</td>
                  <td>
                    <span className={`badge ${
                      t.status === 'APPROVED' ? 'badge-approved' :
                      t.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'
                    }`}>{t.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {t.createdAt ? format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {t.status === 'PENDING' && <>
                        <button className="btn btn-success btn-sm" onClick={() => action(adminApproveTopic, t.id, 'Đã duyệt!')}>✅ Duyệt</button>
                        <button className="btn btn-danger btn-sm" onClick={() => action(adminRejectTopic, t.id, 'Đã từ chối!')}>❌ Từ chối</button>
                      </>}
                      {t.status === 'APPROVED' && <>
                        <button className="btn btn-ghost btn-sm" title="Ghim/bỏ ghim" onClick={() => action(adminPinTopic, t.id, 'Đã cập nhật!')}>
                          {t.pinned ? '📌' : '📌?'}
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Khóa/mở" onClick={() => action(adminLockTopic, t.id, 'Đã cập nhật!')}>
                          {t.locked ? '🔓' : '🔒'}
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Hot/bỏ hot" onClick={() => action(adminHotTopic, t.id, 'Đã cập nhật!')}>
                          🔥
                        </button>
                      </>}
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        if (window.confirm('Xóa topic này?')) action(adminDeleteTopic, t.id, 'Đã xóa!');
                      }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {topics.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Không có topic nào đang chờ duyệt ✅</div>
          )}
        </div>
      )}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`page-btn ${page === i ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
