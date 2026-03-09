import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

export default function FileUpload({ onInsert }) {
    const [uploading, setUploading] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const fileRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) return toast.error('File quá lớn! Tối đa 50MB');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { url, resourceType, originalName } = res.data;
            let insertText = '';
            if (resourceType === 'image') insertText = `\n![${originalName}](${url})\n`;
            else if (resourceType === 'video') insertText = `\n[VIDEO:${url}]\n`;
            else insertText = `\n[FILE:${originalName}:${url}]\n`;
            onInsert(insertText);
            toast.success('Upload thành công!');
            setShowPanel(false);
        } catch (e) {
            toast.error('Upload thất bại!');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setShowPanel(!showPanel)}>
                📎 Đính kèm
            </button>

            {showPanel && (
                <div style={{
                    position: 'absolute', bottom: '100%', left: 0, zIndex: 100,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 16, width: 300,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>
                        📎 Đính kèm file
                    </div>
                    <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                         onClick={() => fileRef.current?.click()}
                         style={{
                             border: '2px dashed var(--border)', borderRadius: 6,
                             padding: '20px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: 12
                         }}>
                        {uploading ? <div>⏳ Đang upload...</div> : (
                            <>
                                <div style={{ fontSize: 24, marginBottom: 6 }}>📤</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kéo thả hoặc click để chọn file</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Ảnh, Video, PDF, Word, Excel • Tối đa 50MB
                                </div>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                                onClick={() => { fileRef.current.accept = 'image/*'; fileRef.current.click(); }}>🖼️ Ảnh</button>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                                onClick={() => { fileRef.current.accept = 'video/*'; fileRef.current.click(); }}>🎬 Video</button>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                                onClick={() => { fileRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx'; fileRef.current.click(); }}>📄 File</button>
                    </div>
                    <input ref={fileRef} type="file" style={{ display: 'none' }}
                           accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                           onChange={e => handleFile(e.target.files[0])} />
                </div>
            )}
        </div>
    );
}