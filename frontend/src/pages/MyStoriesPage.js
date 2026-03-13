import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyStories, createStory, updateMyStory, deleteMyStory } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GENRES = ['Kiếm hiệp', 'Tiên hiệp', 'Huyền huyễn', 'Đô thị', 'Lịch sử', 'Ngôn tình', 'Khoa huyễn', 'Khác'];

const STATUS_LABEL = {
  APPROVED: { text: 'Đã duyệt', color: 'var(--green)' },
  PENDING:  { text: 'Chờ duyệt', color: 'var(--accent)' },
  REJECTED: { text: 'Bị từ chối', color: 'var(--red)' },
};

export default function MyStoriesPage() {
  const navigate = useNavigate();
  const { user, isApproved } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', description: '', coverImage: '', genres: [], status: 'ONGOING' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, []); // eslint-disable-line

  const load = () => {
    setLoading(true);
    getMyStories().then(res => setStories(res.data || [])).finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', author: '', description: '', coverImage: '', genres: [], status: 'ONGOING' });
    setShowModal(true);
  };

  const openEdit = (story) => {
    setEditing(story);
    setForm({
      title: story.title, author: story.author, description: story.description || '',
      coverImage: story.coverImage || '', genres: story.genres || [], status: story.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateMyStory(editing.id, form);
        toast.success('Cập nhật truyện thành công!');
      } else {
        await createStory(form);
        toast.success('Đăng truyện thành công! Đang chờ admin duyệt.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data || 'Có lỗi xảy ra!';
      toast.error(typeof msg === 'string' ? msg : 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (story) => {
    if (!window.confirm(`Xóa truyện "${story.title}"? Tất cả chương sẽ bị xóa!`)) return;
    try {
      await deleteMyStory(story.id);
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

  if (!user) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>📚 Truyện của tôi</h1>
        {isApproved() && (
          <button className="btn btn-primary" onClick={openCreate}>+ Đăng truyện mới</button>
        )}
      </div>

      {!isApproved() && (
        <div className="notice notice-warning" style={{ marginBottom: 16 }}>
          ⚠️ Tài khoản của bạn chưa được duyệt. Bạn cần được admin duyệt tài khoản mới có thể đăng truyện.
        </div>
      )}

      <div className="notice notice-info" style={{ marginBottom: 16, fontSize: 13 }}>
        💡 Truyện mới sẽ ở trạng thái <strong>Chờ duyệt</strong> cho đến khi admin/mod phê duyệt. Bạn có thể thêm chương bất kỳ lúc nào.
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>⏳ Đang tải...</div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Bạn chưa đăng truyện nào</div>
          {isApproved() && (
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 8 }}>
              Đăng truyện đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stories.map(story => {
            const approval = story.approvalStatus || 'APPROVED';
            const statusInfo = STATUS_LABEL[approval] || STATUS_LABEL.APPROVED;
            return (
              <div key={story.id} className="card" style={{ margin: 0 }}>
                <div style={{ padding: '12px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  {/* Cover */}
                  <div style={{ width: 48, height: 72, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                    {story.coverImage
                      ? <img src={story.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚔</div>
                    }
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{story.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: statusInfo.color,
                        background: `${statusInfo.color}18`, padding: '1px 7px', borderRadius: 10,
                        border: `1px solid ${statusInfo.color}44` }}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {story.author} · {story.totalChapters} chương
                      {story.status === 'COMPLETED'
                        ? <span style={{ color: 'var(--green)', marginLeft: 4 }}>· Hoàn thành</span>
                        : <span style={{ color: 'var(--accent)', marginLeft: 4 }}>· Đang ra</span>
                      }
                    </div>
                    {story.genres?.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {story.genres.join(' · ')}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/my-stories/${story.id}/chapters`)}>
                      📖 Chương
                    </button>
                    {approval === 'APPROVED' && (
                      <Link to={`/stories/${story.id}`} className="btn btn-ghost btn-sm">👁 Xem</Link>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(story)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(story)}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal tạo/sửa truyện */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Sửa thông tin truyện' : 'Đăng truyện mới'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!editing && (
                  <div className="notice notice-info" style={{ fontSize: 12, margin: 0 }}>
                    Truyện của bạn sẽ cần được admin/mod duyệt trước khi hiển thị công khai.
                  </div>
                )}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tên truyện *</label>
                  <input className="form-input" value={form.title} required maxLength={200}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tác giả *</label>
                  <input className="form-input" value={form.author} required maxLength={100}
                    placeholder="Tên tác giả gốc"
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
                    maxLength={2000}
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
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Đăng truyện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
