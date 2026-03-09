import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { changePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải ít nhất 6 ký tự!');
      return;
    }
    setLoading(true);
    try {
      const res = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(res.data.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480, padding: '32px 16px' }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">🔒 Đổi mật khẩu</span>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group">
            <label className="form-label">Mật khẩu hiện tại</label>
            <PasswordInput
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <PasswordInput
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Ít nhất 6 ký tự"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu mới</label>
            <PasswordInput
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
