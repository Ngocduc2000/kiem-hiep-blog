import React, { useState } from 'react';
import { submitReport } from '../services/api';
import { toast } from 'react-toastify';

const REASONS = [
  { value: 'SPAM', label: 'Spam / Quảng cáo' },
  { value: 'OFFENSIVE', label: 'Nội dung thô tục / xúc phạm' },
  { value: 'MISINFORMATION', label: 'Thông tin sai lệch' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export default function ReportModal({ targetId, targetType, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { toast.error('Vui lòng chọn lý do báo cáo'); return; }
    setSubmitting(true);
    try {
      await submitReport({ targetId, targetType, reason, description });
      toast.success('Báo cáo đã được gửi, cảm ơn bạn!');
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi khi gửi báo cáo';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 8, padding: 24, width: 420, maxWidth: '90vw'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--text-primary)' }}>
          🚩 Báo cáo nội dung
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Lý do báo cáo *
            </label>
            {REASONS.map(r => (
              <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Mô tả thêm (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề..."
              rows={3}
              maxLength={500}
              style={{
                width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-primary)', padding: '8px 10px',
                fontSize: 13, resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting || !reason}>
              {submitting ? 'Đang gửi...' : '🚩 Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
