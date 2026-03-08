import React, { useEffect, useState } from 'react';
import { getCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../services/api';
import { toast } from 'react-toastify';

const emptyForm = { name: '', slug: '', description: '', icon: '💬', displayOrder: 1 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => getCategories().then(res => setCategories(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminUpdateCategory(editing, form);
        toast.success('Đã cập nhật!');
      } else {
        await adminCreateCategory(form);
        toast.success('Đã tạo danh mục!');
      }
      setForm(emptyForm); setEditing(null); setShowForm(false);
      load();
    } catch { toast.error('Lỗi!'); }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, displayOrder: cat.displayOrder });
    setEditing(cat.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa danh mục này?')) return;
    await adminDeleteCategory(id);
    toast.success('Đã xóa!');
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, color: 'var(--accent)' }}>🗂️ Quản lý danh mục</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(!showForm); }}>
          {showForm ? '✕ Đóng' : '+ Thêm danh mục'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">{editing ? '✏️ Sửa' : '➕ Thêm'} danh mục</span></div>
          <form onSubmit={handleSubmit} style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Tên *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input className="form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Mô tả</label>
              <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Icon (emoji)</label>
              <input className="form-input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Thứ tự</label>
              <input className="form-input" type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: +e.target.value })} />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Icon</th><th>Tên</th><th>Mô tả</th><th>Thứ tự</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td style={{ fontSize: 20 }}>{c.icon}</td>
                <td><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.slug}</div></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{c.description}</td>
                <td style={{ textAlign: 'center' }}>{c.displayOrder}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
