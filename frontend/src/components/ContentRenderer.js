import React from 'react';

export default function ContentRenderer({ content }) {
    if (!content) return null;
    const parts = content.split(/(\n?\!\[.*?\]\(.*?\)\n?|\n?\[VIDEO:.*?\]\n?|\n?\[FILE:.*?:.*?\]\n?)/g);

    return (
        <div className="post-content">
            {parts.map((part, i) => {
                const imgMatch = part.match(/\!\[(.*?)\]\((https?:\/\/.*?)\)/);
                if (imgMatch) return (
                    <div key={i} style={{ margin: '12px 0', textAlign: 'center' }}>
                        <img src={imgMatch[2]} alt={imgMatch[1]}
                             style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}
                             onClick={() => window.open(imgMatch[2], '_blank')} />
                    </div>
                );

                const videoMatch = part.match(/\[VIDEO:(https?:\/\/.*?)\]/);
                if (videoMatch) return (
                    <div key={i} style={{ margin: '12px 0' }}>
                        <video controls style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 6 }} src={videoMatch[1]}>
                            Trình duyệt không hỗ trợ video.
                        </video>
                    </div>
                );

                const fileMatch = part.match(/\[FILE:(.*?):(https?:\/\/.*?)\]/);
                if (fileMatch) {
                    const ext = fileMatch[1].split('.').pop().toUpperCase();
                    const icon = ext === 'PDF' ? '📕' : ext === 'DOCX' || ext === 'DOC' ? '📘' : ext === 'XLSX' || ext === 'XLS' ? '📗' : '📄';
                    return (
                        <div key={i} style={{ margin: '8px 0' }}>
                            <a href={fileMatch[2]} target="_blank" rel="noopener noreferrer"
                               style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                                   borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                   color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>
                                <span style={{ fontSize: 20 }}>{icon}</span>
                                <span>{fileMatch[1]}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⬇ Tải xuống</span>
                            </a>
                        </div>
                    );
                }

                if (part.trim()) return <span key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{part}</span>;
                return null;
            })}
        </div>
    );
}