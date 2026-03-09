import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getStory, getStoryChapters, getChapterForEdit, adminAddChapter, adminUpdateChapter, adminDeleteChapter } from '../../services/api';

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ align: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['clean']
  ]
};

export default function AdminStoryChapters() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [fetchingContent, setFetchingContent] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    getStory(storyId).then(res => setStory(res.data));
  }, [storyId]);

  const loadChapters = useCallback(() => {
    setListLoading(true);
    getStoryChapters(storyId, { page, size: 50, q: search || undefined })
      .then(res => {
        setChapters(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .finally(() => setListLoading(false));
  }, [storyId, page, search]);

  useEffect(() => { loadChapters(); }, [loadChapters]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', content: '' });
    setShowForm(true);
  };

  const openEdit = async (ch) => {
    setEditing(ch);
    setForm({ title: ch.title, content: '' });
    setShowForm(true);
    setFetchingContent(true);
    try {
      const res = await getChapterForEdit(storyId, ch.id);
      setForm({ title: res.data.title, content: res.data.content || '' });
    } catch {
      toast.error('Không tải được nội dung chương!');
    } finally {
      setFetchingContent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content || form.content === '<p><br></p>') {
      toast.error('Vui lòng nhập nội dung chương!');
      return;
    }
    setSaving(true);
    try {
      const res = editing
        ? await adminUpdateChapter(storyId, editing.id, form)
        : await adminAddChapter(storyId, form);
      const saved = res.data;
      if (editing) {
        setChapters(cs => cs.map(c => c.id === editing.id ? { ...c, title: saved.title, wordCount: saved.wordCount } : c));
        toast.success('Cập nhật chương thành công!');
      } else {
        setStory(s => s ? { ...s, totalChapters: (s.totalChapters || 0) + 1 } : s);
        loadChapters();
        toast.success('Thêm chương thành công!');
      }
      setShowForm(false);
    } catch {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ch) => {
    if (!window.confirm(`Xóa chương ${ch.chapterNumber}: "${ch.title}"?`)) return;
    try {
      await adminDeleteChapter(storyId, ch.id);
      setChapters(cs => cs.filter(c => c.id !== ch.id));
      setStory(s => s ? { ...s, totalChapters: Math.max(0, (s.totalChapters || 1) - 1) } : s);
      toast.success('Đã xóa chương!');
    } catch {
      toast.error('Xóa thất bại!');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  if (!story) return <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/stories')}>← Quay lại</button>
        <h2 style={{ fontSize: 18, color: 'var(--accent)', flex: 1 }}>
          📖 {story.title}
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
            ({story.totalChapters} chương)
          </span>
        </h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm chương</button>
      </div>

      {!showForm ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 1, fontSize: 13 }}
                placeholder="Tìm tên chương..." value={searchInput}
                onChange={e => setSearchInput(e.target.value)} />
              <button type="submit" className="btn btn-ghost btn-sm">🔍</button>
              {search && (
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}>✕</button>
              )}
            </form>
          </div>

          {listLoading ? (
            <div style={{ color: 'var(--text-muted)', padding: 20 }}>⏳ Đang tải...</div>
          ) : chapters.length === 0 ? (
            <div className="notice notice-info">
              {search ? 'Không tìm thấy chương nào.' : 'Chưa có chương nào. Thêm chương đầu tiên!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chapters.map(ch => (
                <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 40 }}>Ch.{ch.chapterNumber}</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{ch.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(ch.wordCount || 0).toLocaleString()} chữ</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ch)}>✏️ Sửa</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ch)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 16 }}>
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                <button key={i} className={`page-btn ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {editing ? `Sửa: Ch.${editing.chapterNumber} — ${editing.title}` : 'Thêm chương mới'}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕ Hủy</button>
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
              {fetchingContent ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải nội dung...</div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 4, minHeight: 420 }}>
                  <ReactQuill theme="snow" value={form.content}
                    onChange={val => setForm(f => ({ ...f, content: val }))}
                    style={{ height: 400 }} modules={QUILL_MODULES} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 60 }}>
              <button type="submit" className="btn btn-primary" disabled={saving || fetchingContent}>
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
