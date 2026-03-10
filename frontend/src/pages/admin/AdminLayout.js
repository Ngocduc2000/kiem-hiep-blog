import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const adminNavItems = [
  { path: '/admin', label: '📊 Dashboard', exact: true },
  { path: '/admin/users', label: '👥 Quản lý thành viên' },
  { path: '/admin/topics', label: '📋 Phê duyệt bài đăng' },
  { path: '/admin/categories', label: '🗂️ Danh mục' },
  { path: '/admin/stories', label: '📚 Truyện' },
  { path: '/admin/announcements', label: '📢 Thông báo' },
];

const modNavItems = [
  { path: '/admin', label: '📊 Dashboard', exact: true },
  { path: '/admin/topics', label: '📋 Phê duyệt bài đăng' },
  { path: '/admin/announcements', label: '📢 Thông báo' },
];

export default function AdminLayout() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = isAdmin() ? adminNavItems : modNavItems;
  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, color: 'var(--accent)' }}>
            {isAdmin() ? '⚔ Admin Panel' : '🛡 Mod Panel'}
          </div>
        </div>
        {navItems.map(item => (
          <div
            key={item.path}
            className={`admin-nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 20, width: 220 }}>
          <div className="admin-nav-item" onClick={() => navigate('/')}>🏠 Về trang chủ</div>
          <div className="admin-nav-item" style={{ color: 'var(--red)' }} onClick={logout}>🚪 Đăng xuất</div>
        </div>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
