import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
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
                  {isAdmin() && (
                    <div className="user-menu-item" onClick={() => { navigate('/admin'); setMenuOpen(false); }}>
                      🛡️ Quản trị
                    </div>
                  )}
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
