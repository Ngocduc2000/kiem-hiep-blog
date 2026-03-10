import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getUserProfile, updateMyProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LevelBadge, { getLevelInfo, getNextLevel, LEVELS } from '../components/LevelBadge';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '', bio: '' });
  const [saving, setSaving] = useState(false);

  const isOwn = me?.username === username;

  useEffect(() => {
    setLoading(true);
    getUserProfile(username)
      .then(res => {
        setProfile(res.data);
        setForm({ displayName: res.data.displayName || '', bio: res.data.bio || '' });
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [username]); // eslint-disable-line

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim()) return;
    setSaving(true);
    try {
      const res = await updateMyProfile(form);
      setProfile(p => ({ ...p, displayName: res.data.displayName, bio: res.data.bio }));
      // Update stored user
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.displayName = res.data.displayName;
      localStorage.setItem('user', JSON.stringify(stored));
      setEditing(false);
      toast.success('Cập nhật profile thành công!');
    } catch {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải...</div>;
  if (!profile) return null;

  const roleLabel = profile.roles?.includes('ADMIN') ? '⚔ Admin' : profile.roles?.includes('MOD') ? '🛡 Mod' : '👤 Thành viên';
  const roleColor = profile.roles?.includes('ADMIN') ? 'var(--accent)' : profile.roles?.includes('MOD') ? 'var(--blue)' : 'var(--text-muted)';
  const exp = profile.exp || 0;
  const levelInfo = getLevelInfo(exp);
  const nextLevel = getNextLevel(exp);
  const currentThreshold = profile.currentThreshold || levelInfo.min;
  const nextThreshold = profile.nextThreshold || (nextLevel ? nextLevel.min : exp);
  const isMaxLevel = !nextLevel;
  const progress = isMaxLevel ? 100 : Math.min(100, Math.round(((exp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      {/* Profile card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div className="avatar" style={{ width: 72, height: 72, fontSize: 28, flexShrink: 0 }}>
            {(profile.displayName || profile.username)?.[0]?.toUpperCase()}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                {profile.displayName || profile.username}
              </h2>
              <span style={{ fontSize: 12, color: roleColor, fontWeight: 600 }}>{roleLabel}</span>
              <LevelBadge exp={exp} size="md" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>@{profile.username}</div>
            {profile.bio && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{profile.bio}</p>
            )}

            {/* EXP Progress Bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span style={{ color: levelInfo.color, fontWeight: 600 }}>{levelInfo.name}</span>
                <span>{exp.toLocaleString()} / {isMaxLevel ? '∞' : nextThreshold.toLocaleString()} EXP</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: `linear-gradient(90deg, ${levelInfo.color}88, ${levelInfo.color})`,
                  borderRadius: 4, transition: 'width 0.5s ease'
                }} />
              </div>
              {!isMaxLevel && nextLevel && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {nextThreshold - exp > 0 ? `Cần thêm ${(nextThreshold - exp).toLocaleString()} EXP để lên ${nextLevel.name}` : ''}
                </div>
              )}
              {isMaxLevel && <div style={{ fontSize: 11, color: levelInfo.color, marginTop: 3 }}>✨ Đã đạt cảnh giới tối cao!</div>}
            </div>

            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>📝 {profile.topicCount || 0} bài viết</span>
              <span>💬 {profile.postCount || 0} bình luận</span>
              {profile.createdAt && (
                <span>📅 Tham gia {format(new Date(profile.createdAt), 'MM/yyyy', { locale: vi })}</span>
              )}
            </div>
          </div>
          {/* Edit button */}
          {isOwn && !editing && (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏️ Chỉnh sửa</button>
          )}
        </div>

        {/* Edit form */}
        {isOwn && editing && (
          <form onSubmit={handleSave} style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="form-group">
              <label className="form-label">Tên hiển thị *</label>
              <input className="form-input" value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                maxLength={50} required />
            </div>
            <div className="form-group">
              <label className="form-label">Giới thiệu bản thân</label>
              <textarea className="form-input" rows={3} value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                maxLength={300} placeholder="Viết gì đó về bạn..." style={{ resize: 'vertical' }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>{form.bio.length}/300</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Hủy</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
