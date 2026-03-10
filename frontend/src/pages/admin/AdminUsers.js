import React, { useEffect, useState } from 'react';
import { adminGetUsers, adminApproveUser, adminRejectUser, adminBanUser, adminMakeMod, adminRemoveMod } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('PENDING');

  const loadUsers = () => {
    setLoading(true);
    adminGetUsers({ page, size: 20 })
      .then(res => {
        setUsers(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [page]);

  const handleApprove = async (id) => {
    await adminApproveUser(id);
    toast.success('Đã phê duyệt thành viên!');
    loadUsers();
  };

  const handleReject = async (id) => {
    await adminRejectUser(id);
    toast.success('Đã từ chối thành viên!');
    loadUsers();
  };

  const handleBan = async (id) => {
    const reason = prompt('Lý do cấm:');
    if (!reason) return;
    await adminBanUser(id, reason);
    toast.success('Đã cấm thành viên!');
    loadUsers();
  };

  const handleMakeMod = async (id) => {
    await adminMakeMod(id);
    toast.success('Đã bổ nhiệm Mod!');
    loadUsers();
  };

  const handleRemoveMod = async (id) => {
    await adminRemoveMod(id);
    toast.success('Đã gỡ quyền Mod!');
    loadUsers();
  };

  const filtered = users.filter(u => {
    if (filter === 'ALL') return true;
    return u.memberStatus === filter;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, color: 'var(--accent)' }}>👥 Quản lý thành viên</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? '⏳ Chờ duyệt' :
               f === 'APPROVED' ? '✅ Đã duyệt' : '❌ Từ chối'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ color: 'var(--text-muted)' }}>⏳ Đang tải...</div> : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Bài viết</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.displayName || u.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                    {u.roles?.includes('ADMIN') && <span className="badge badge-hot" style={{ fontSize: 10 }}>ADMIN</span>}
                    {u.roles?.includes('MOD') && !u.roles?.includes('ADMIN') && <span className="badge" style={{ fontSize: 10, background: 'rgba(74,158,255,0.2)', color: 'var(--blue)' }}>MOD</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${
                      u.memberStatus === 'APPROVED' ? 'badge-approved' :
                      u.memberStatus === 'PENDING' ? 'badge-pending' : 'badge-rejected'
                    }`}>{u.memberStatus}</span>
                    {u.banned && <span className="badge badge-rejected" style={{ marginLeft: 4 }}>BANNED</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: vi }) : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>{u.postCount || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {u.memberStatus === 'PENDING' && !u.roles?.includes('ADMIN') && <>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(u.id)}>✅</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(u.id)}>❌</button>
                      </>}
                      {u.memberStatus === 'APPROVED' && !u.roles?.includes('ADMIN') && (<>
                        <button className="btn btn-danger btn-sm" onClick={() => handleBan(u.id)}>🚫</button>
                        {u.roles?.includes('MOD')
                          ? <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveMod(u.id)} title="Gỡ Mod">🛡✕</button>
                          : <button className="btn btn-ghost btn-sm" onClick={() => handleMakeMod(u.id)} title="Bổ nhiệm Mod">🛡+</button>
                        }
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Không có thành viên nào.</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`page-btn ${page === i ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
