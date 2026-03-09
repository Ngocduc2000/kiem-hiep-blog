import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getStories, adminCreateStory, adminUpdateStory, adminDeleteStory } from '../../services/api';

const GENRES = ['Kiếm hiệp', 'Tiên hiệp', 'Huyền huyễn', 'Đô thị', 'Lịch sử', 'Ngôn tình', 'Khoa huyễn', 'Khác'];

export default function AdminStories() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', author: '', description: '', coverImage: '', genres: [], status: 'ONGOING'
  });

  const load = () => {
    setLoading(true);
    getStories({ size: 100 }).then(res => setStories(res.data.content || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', author: '', description: '', coverImage: '', genres: [], status: 'ONGOING' });
    setShowModal(true);
  };

  const openEdit = (story) => {
    setEditing(story);
    setForm({
      title: story.title, author: story.author, description: story.description,
      coverImage: story.coverImage || '', genres: story.genres || [], status: story.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminUpdateStory(editing.id, form);
        toast.success('Cập nhật truyện thành công!');
      } else {
        await adminCreateStory(form);
        toast.success('Thêm truyện thành công!');
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa truyện "${title}"? Tất cả chương sẽ bị xóa!`)) return;
    try {
      await adminDeleteStory(id);
      toast.success('Đã xóa truyện!');
      load();
    } catch {
      toast.error('Xóa thất bại!');
    }
  };

  const toggleGenre = (g) => {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g]
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, color: 'var(--accent)' }}>📚 Quản lý truyện</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm truyện</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
      ) : stories.length === 0 ? (
        <div className="notice notice-info">Chưa có truyện nào.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stories.map(story => (
            <div key={story.id} className="card" style={{ margin: 0 }}>
              <div style={{ padding: '12px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  width: 48, height: 72, background: 'var(--bg-tertiary)',
                  borderRadius: 4, overflow: 'hidden', flexShrink: 0
                }}>
                  {story.coverImage
                    ? <img src={story.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚔</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{story.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {story.author} · {story.totalChapters} chương · 👁 {story.viewCount}
                    · <span style={{ color: story.status === 'COMPLETED' ? 'var(--green)' : 'var(--accent)' }}>
                      {story.status === 'COMPLETED' ? 'Hoàn' : 'Đang ra'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/admin/stories/${story.id}/chapters`)}>
                    📖 Chương
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(story)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(story.id, story.title)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Sửa truyện' : 'Thêm truyện mới'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tên truyện *</label>
                  <input className="form-input" value={form.title} required
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tác giả *</label>
                  <input className="form-input" value={form.author} required
                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ảnh bìa (URL)</label>
                  <input className="form-input" value={form.coverImage} placeholder="https://..."
                    onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-textarea" value={form.description} rows={3}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Thể loại</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {GENRES.map(g => (
                      <button key={g} type="button"
                        className={`btn btn-sm ${form.genres.includes(g) ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => toggleGenre(g)}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Trạng thái</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="ONGOING">Đang cập nhật</option>
                    <option value="COMPLETED">Hoàn thành</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Lưu thay đổi' : 'Thêm truyện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
