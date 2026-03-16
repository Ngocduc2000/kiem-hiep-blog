import React, { useEffect, useState } from 'react';
import { adminGetReports, adminResolveReport, adminDismissReport } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const REASON_LABELS = {
  SPAM: 'Spam / Quảng cáo',
  OFFENSIVE: 'Nội dung thô tục',
  MISINFORMATION: 'Thông tin sai lệch',
  OTHER: 'Lý do khác',
};

const TARGET_LINKS = {
  POST: (id) => null, // posts are shown inside topics, no direct link
  TOPIC: (id) => `/topic/${id}`,
  CHAPTER_COMMENT: (id) => null,
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolution, setResolution] = useState('');

  const load = () => {
    setLoading(true);
    adminGetReports({ page, size: 20, status: statusFilter || undefined })
      .then(res => {
        setReports(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleDismiss = async (id) => {
    try {
      await adminDismissReport(id);
      toast.success('Đã bỏ qua báo cáo');
      load();
    } catch {
      toast.error('Lỗi thao tác!');
    }
  };

  const handleResolve = async () => {
    try {
      await adminResolveReport(resolveModal, { resolution });
      toast.success('Đã xử lý báo cáo');
      setResolveModal(null);
      setResolution('');
      load();
    } catch {
      toast.error('Lỗi thao tác!');
    }
  };

  const statusBadge = (s) => {
    if (s === 'PENDING') return <span className="badge badge-pending">Chờ xử lý</span>;
    if (s === 'RESOLVED') return <span className="badge badge-approved">Đã xử lý</span>;
    if (s === 'DISMISSED') return <span className="badge badge-rejected">Bỏ qua</span>;
    return s;
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, color: 'var(--accent)', marginBottom: 16 }}>🚩 Quản lý báo cáo</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['PENDING', 'RESOLVED', 'DISMISSED', ''].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setStatusFilter(s); setPage(0); }}
          >
            {s === 'PENDING' ? 'Chờ xử lý' : s === 'RESOLVED' ? 'Đã xử lý' : s === 'DISMISSED' ? 'Bỏ qua' : 'Tất cả'}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div> : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Nội dung bị báo cáo</th>
                <th>Người báo cáo</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const link = TARGET_LINKS[r.targetType]?.(r.targetId);
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                        {r.targetType}
                      </div>
                      {link ? (
                        <Link to={link} style={{ fontSize: 13, color: 'var(--accent)' }}>
                          #{r.targetId.slice(-8)}
                        </Link>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>#{r.targetId.slice(-8)}</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {r.reporterUsername}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{REASON_LABELS[r.reason] || r.reason}</div>
                      {r.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '-'}
                    </td>
                    <td>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => { setResolveModal(r.id); setResolution(''); }}
                          >
                            ✅ Xử lý
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDismiss(r.id)}
                          >
                            🚫 Bỏ qua
                          </button>
                        </div>
                      )}
                      {r.status !== 'PENDING' && r.reviewedBy && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          bởi {r.reviewedBy}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {reports.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
              Không có báo cáo nào ✅
            </div>
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

      {resolveModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setResolveModal(null)}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 24, width: 380, maxWidth: '90vw'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)' }}>
              ✅ Xử lý báo cáo
            </h3>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              placeholder="Ghi chú xử lý (tùy chọn)..."
              rows={3}
              style={{
                width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-primary)', padding: '8px 10px',
                fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setResolveModal(null)}>Hủy</button>
              <button className="btn btn-success" onClick={handleResolve}>✅ Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
