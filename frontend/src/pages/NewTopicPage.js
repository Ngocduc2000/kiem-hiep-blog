import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCategories, createTopic } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function NewTopicPage() {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    categoryId: params.get('cat') || '',
    content: '',
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { user, isApproved } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
  }, []);

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>
    <Link to="/login">Đăng nhập</Link> để tạo topic.
  </div>;

  if (!isApproved()) return <div style={{ padding: 40, textAlign: 'center' }}>
    <div className="notice notice-warning">⏳ Tài khoản chưa được phê duyệt. Vui lòng chờ admin xác nhận.</div>
  </div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề!');
    if (!form.categoryId) return toast.error('Vui lòng chọn danh mục!');
    if (!form.content.trim()) return toast.error('Vui lòng nhập nội dung!');

    setSubmitting(true);
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await createTopic({ ...form, tags });
      toast.success('Tạo topic thành công! Đang chờ admin phê duyệt.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data || 'Lỗi tạo topic!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 800, margin: '20px auto' }}>
        <div className="breadcrumb" style={{ marginBottom: 12 }}>
          <Link to="/">🏠 Trang chủ</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Tạo Topic Mới</span>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">✏️ Tạo chủ đề mới</span></div>
          <form onSubmit={handleSubmit} style={{ padding: 20 }}>
            <div className="notice notice-warning" style={{ marginBottom: 16 }}>
              📋 Topic của bạn sẽ được gửi đến admin để phê duyệt trước khi hiển thị.
            </div>
            <div className="form-group">
              <label className="form-label">Danh mục *</label>
              <select className="form-select" value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tiêu đề *</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Nhập tiêu đề chủ đề..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Nội dung *</label>
              <textarea className="form-textarea" value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="Viết nội dung chủ đề của bạn..."
                style={{ minHeight: 200 }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (phân cách bằng dấu phẩy)</label>
              <input className="form-input" value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="ví dụ: Kim Dung, Tiếu Ngạo, Kiếm Hiệp" />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? '⏳ Đang gửi...' : '📨 Tạo Topic'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
