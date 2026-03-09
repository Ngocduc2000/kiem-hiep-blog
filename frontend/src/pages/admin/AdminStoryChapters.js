import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getStory, adminAddChapter, adminUpdateChapter, adminDeleteChapter } from '../../services/api';

export default function AdminStoryChapters() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getStory(storyId).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [storyId]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', content: '' });
    setShowForm(true);
  };

  const openEdit = (ch) => {
    setEditing(ch);
    setForm({ title: ch.title, content: ch.content });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) { toast.error('Vui lòng nhập nội dung chương!'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminUpdateChapter(storyId, editing.id, form);
        toast.success('Cập nhật chương thành công!');
      } else {
        await adminAddChapter(storyId, form);
        toast.success('Thêm chương thành công!');
      }
      setShowForm(false);
      load();
    } catch {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapterId, title) => {
    if (!window.confirm(`Xóa "${title}"?`)) return;
    try {
      await adminDeleteChapter(storyId, chapterId);
      toast.success('Đã xóa chương!');
      load();
    } catch {
      toast.error('Xóa thất bại!');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;
  if (!data) return <div style={{ color: 'var(--red)' }}>Không tìm thấy truyện</div>;

  const { story, chapters } = data;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/stories')}>← Quay lại</button>
        <h2 style={{ fontSize: 18, color: 'var(--accent)', flex: 1 }}>
          📖 {story.title} — Quản lý chương
        </h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm chương</button>
      </div>

      {!showForm ? (
        chapters.length === 0 ? (
          <div className="notice notice-info">Chưa có chương nào. Thêm chương đầu tiên!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chapters.map(ch => (
              <div key={ch.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 6
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 36 }}>
                  Ch.{ch.chapterNumber}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{ch.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {ch.wordCount?.toLocaleString()} chữ
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ch)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ch.id, ch.title)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{editing ? `Sửa: ${editing.title}` : 'Thêm chương mới'}</span>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: 20 }}>
            <div className="form-group">
              <label className="form-label">Tiêu đề chương *</label>
              <input className="form-input" value={form.title} required
                placeholder="Vd: Gặp gỡ tình cờ"
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Nội dung chương *</label>
              <div style={{ background: '#fff', borderRadius: 4, minHeight: 400 }}>
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={val => setForm(f => ({ ...f, content: val }))}
                  style={{ height: 360 }}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'align': [] }],
                      [{ 'size': ['small', false, 'large', 'huge'] }],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 56 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm chương'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
