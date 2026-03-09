import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const REACTIONS = [
    { type: 'LIKE',  emoji: '👍', label: 'Thích' },
    { type: 'LOVE',  emoji: '❤️', label: 'Yêu thích' },
    { type: 'HAHA',  emoji: '😂', label: 'Haha' },
    { type: 'WOW',   emoji: '😮', label: 'Wow' },
    { type: 'SAD',   emoji: '😢', label: 'Buồn' },
    { type: 'ANGRY', emoji: '😡', label: 'Tức giận' },
];

export default function ReactionBar({ targetType, targetId }) {
    const { user } = useAuth();
    const [counts, setCounts] = useState({});
    const [userReaction, setUserReaction] = useState(null);
    const [total, setTotal] = useState(0);
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const pickerRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => { fetchReactions(); }, [targetId]);

    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchReactions = async () => {
        try {
            const res = await api.get(`/api/reactions/${targetType}/${targetId}`);
            setCounts(res.data.counts || {});
            setUserReaction(res.data.userReaction);
            setTotal(res.data.total || 0);
        } catch (e) {}
    };

    const handleReact = async (type) => {
        if (!user) return alert('Vui lòng đăng nhập để thả cảm xúc!');
        if (loading) return;
        setLoading(true);
        setShowPicker(false);
        try {
            const res = await api.post(`/api/reactions/${targetType}/${targetId}`, { type });
            const { action } = res.data;
            setCounts(prev => {
                const next = { ...prev };
                if (action === 'removed') {
                    next[type] = Math.max(0, (next[type] || 1) - 1);
                    setUserReaction(null);
                    setTotal(t => Math.max(0, t - 1));
                } else if (action === 'updated') {
                    next[userReaction] = Math.max(0, (next[userReaction] || 1) - 1);
                    next[type] = (next[type] || 0) + 1;
                    setUserReaction(type);
                } else {
                    next[type] = (next[type] || 0) + 1;
                    setUserReaction(type);
                    setTotal(t => t + 1);
                }
                return next;
            });
        } catch (e) {}
        setLoading(false);
    };

    const currentReaction = REACTIONS.find(r => r.type === userReaction);
    const topReactions = REACTIONS
        .filter(r => (counts[r.type] || 0) > 0)
        .sort((a, b) => (counts[b.type] || 0) - (counts[a.type] || 0))
        .slice(0, 3);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <div ref={pickerRef} style={{ position: 'relative' }}>
                <button type="button" className="btn btn-ghost btn-sm"
                        style={{ color: userReaction ? 'var(--accent)' : 'var(--text-muted)', fontWeight: userReaction ? 600 : 400 }}
                        onMouseEnter={() => { timerRef.current = setTimeout(() => setShowPicker(true), 400); }}
                        onMouseLeave={() => clearTimeout(timerRef.current)}
                        onClick={() => { if (userReaction) handleReact(userReaction); else setShowPicker(p => !p); }}>
                    {currentReaction ? `${currentReaction.emoji} ${currentReaction.label}` : '👍 Thích'}
                </button>

                {showPicker && (
                    <div onMouseEnter={() => clearTimeout(timerRef.current)}
                         onMouseLeave={() => setShowPicker(false)}
                         style={{
                             position: 'absolute', bottom: '110%', left: 0, zIndex: 200,
                             background: 'var(--bg-card)', border: '1px solid var(--border)',
                             borderRadius: 30, padding: '8px 12px', display: 'flex', gap: 4,
                             boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                             animation: 'reactionPop 0.15s ease'
                         }}>
                        {REACTIONS.map(r => (
                            <button key={r.type} type="button" title={r.label}
                                    onClick={() => handleReact(r.type)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: 24, padding: '2px 4px', borderRadius: '50%',
                                        transition: 'transform 0.1s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4) translateY(-4px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                {r.emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {total > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                    <span>{topReactions.map(r => <span key={r.type}>{r.emoji}</span>)}</span>
                    <span>{total}</span>
                </div>
            )}

            <style>{`
        @keyframes reactionPop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
        </div>
    );
}