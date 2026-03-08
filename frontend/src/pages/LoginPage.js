import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div className="card-header"><span className="card-title">⚔ Đăng nhập</span></div>
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input className="form-input" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input className="form-input" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '9px' }} disabled={loading}>
            {loading ? '⏳ Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Đăng ký thành công! Vui lòng chờ admin phê duyệt.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đăng ký!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 450 }}>
        <div className="card-header"><span className="card-title">📝 Đăng ký tài khoản</span></div>
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div className="notice notice-info" style={{ marginBottom: 14 }}>
            ℹ️ Sau khi đăng ký, tài khoản cần được admin phê duyệt trước khi có thể đăng bài.
          </div>
          <div className="form-group">
            <label className="form-label">Tên hiển thị</label>
            <input className="form-input" value={form.displayName}
              onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="Tên bạn muốn hiển thị" />
          </div>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập *</label>
            <input className="form-input" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} required minLength={3} maxLength={20} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu *</label>
            <input className="form-input" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '9px' }} disabled={loading}>
            {loading ? '⏳ Đang đăng ký...' : 'Đăng ký'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
