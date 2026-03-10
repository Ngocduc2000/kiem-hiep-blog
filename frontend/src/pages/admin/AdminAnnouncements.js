import React, { useEffect, useState } from 'react';
import { adminGetAllAnnouncements, adminCreateAnnouncement, adminUpdateAnnouncement, adminDeleteAnnouncement } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const TYPES = [
  { value: 'INFO', label: '📢 Thông báo', color: 'var(--blue)' },
  { value: 'WARNING', label: '⚠️ Cảnh báo', color: 'var(--red)' },
  { value: 'EVENT', label: '🎉 Sự kiện', color: 'var(--accent)' },
];

const emptyForm = { title: '', content: '', type: 'INFO', pinned: true };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetAllAnnouncements()
      .then(res => setAnnouncements(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    setSaving(true);
    try {
      if (editId) {
        await adminUpdateAnnouncement(editId, form);
        toast.success('Đã cập nhật thông báo!');
      } else {
        await adminCreateAnnouncement(form);
        toast.success('Đã tạo thông báo!');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      load();
    } catch { toast.error('Lỗi khi lưu thông báo'); }
    finally { setSaving(false); }
  };

  const handleEdit = (ann) => {
    setForm({ title: ann.title, content: ann.content || '', type: ann.type || 'INFO', pinned: ann.pinned });
    setEditId(ann.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa thông báo này?')) return;
    await adminDeleteAnnouncement(id);
    toast.success('Đã xóa!');
    load();
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, color: 'var(--accent)' }}>📢 Quản lý thông báo</h2>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Tạo thông báo</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, padding: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12, color: 'var(--text-primary)' }}>
            {editId ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tiêu đề *</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Tiêu đề thông báo..." />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nội dung</label>
              <textarea className="form-input" rows={3} value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Nội dung chi tiết (không bắt buộc)..."
                style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Loại</label>
                <select className="form-select" style={{ width: 160 }} value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 2 }}>
                <input type="checkbox" id="pinnedChk" checked={form.pinned}
                  onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                <label htmlFor="pinnedChk" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  📌 Ghim (hiện trên trang chủ)
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? '⏳' : editId ? '💾 Lưu' : '✅ Tạo'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
      ) : announcements.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Chưa có thông báo nào.</div>
      ) : (
        <div className="card">
          {announcements.map((ann, idx) => {
            const typeInfo = TYPES.find(t => t.value === ann.type) || TYPES[0];
            return (
              <div key={ann.id} style={{
                padding: '12px 16px',
                borderBottom: idx < announcements.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', gap: 12, alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ann.title}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--bg-tertiary)', color: typeInfo.color, border: `1px solid ${typeInfo.color}`, fontWeight: 600 }}>
                      {typeInfo.label}
                    </span>
                    {ann.pinned && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>📌 Ghim</span>}
                    {!ann.pinned && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ẩn</span>}
                  </div>
                  {ann.content && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>{ann.content}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    bởi {ann.createdBy} · {ann.createdAt ? format(new Date(ann.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(ann)} title="Sửa">✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ann.id)} title="Xóa">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
