import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';

export default function Header() {
  const { user, logout, isAdmin, isMod } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">⚔ Kiếm Hiệp Vô Song</Link>

        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 320, margin: '0 16px' }}>
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="Tìm kiếm topic..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">🔍</button>
          </div>
        </form>

        <nav className="header-nav">
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            style={{ fontSize: 16, padding: '4px 8px', minWidth: 32 }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')}
              style={{ fontSize: 16, padding: '4px 8px', minWidth: 32 }}>
              🔔
            </button>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, background: 'var(--red)',
                color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%',
                width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
          <Link to="/stories" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
            📚 Thư viện
          </Link>
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <div className="user-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="avatar" style={{ width: 26, height: 26, fontSize: 12 }}>
                  {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user.displayName || user.username}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>▼</span>
              </div>
              {menuOpen && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-item" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {user.memberStatus === 'PENDING' ? '⏳ Chờ phê duyệt' :
                     user.memberStatus === 'APPROVED' ? '✅ Thành viên' : '❌ Bị từ chối'}
                  </div>
                  {(isAdmin() || isMod()) && (
                    <div className="user-menu-item" onClick={() => { navigate('/admin'); setMenuOpen(false); }}>
                      {isAdmin() ? '🛡️ Quản trị' : '🛡️ Mod Panel'}
                    </div>
                  )}
                  <div className="user-menu-item" onClick={() => { navigate(`/profile/${user.username}`); setMenuOpen(false); }}>
                    👤 Trang cá nhân
                  </div>
                  <div className="user-menu-item" onClick={() => { navigate('/change-password'); setMenuOpen(false); }}>
                    🔒 Đổi mật khẩu
                  </div>
                  <div className="user-menu-item" onClick={() => { navigate('/library'); setMenuOpen(false); }}>
                    📚 Thư viện của tôi
                  </div>
                  <div className="user-menu-item" style={{ color: 'var(--red)' }} onClick={handleLogout}>
                    🚪 Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"><button className="btn btn-ghost btn-sm">Đăng nhập</button></Link>
              <Link to="/register"><button className="btn btn-primary btn-sm">Đăng ký</button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
