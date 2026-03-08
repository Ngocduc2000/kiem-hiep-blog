import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getTopic, getTopicPosts, replyTopic, getCategories } from '../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function PostItem({ post, onQuote, isFirst }) {
  return (
    <div className="post-item">
      <div className="post-header">
        <div className="avatar">{post.authorName?.[0]?.toUpperCase()}</div>
        <div>
          <div className="post-author">{post.authorName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Thành viên</div>
        </div>
        <div className="post-time">
          {post.createdAt ? format(new Date(post.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi }) : ''}
          {isFirst && <span style={{ marginLeft: 6, color: 'var(--accent)', fontSize: 10 }}>OP</span>}
        </div>
      </div>
      <div className="post-content">
        {post.quotedContent && (
          <div className="quote-box">
            <div className="quote-author">↩ {post.quotedAuthorName} viết:</div>
            <div style={{ fontStyle: 'italic' }}>{post.quotedContent}</div>
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
      </div>
      <div className="post-footer">
        <button className="btn btn-ghost btn-sm" onClick={() => onQuote(post)}>↩ Trích dẫn</button>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>❤️ {post.likeCount || 0}</span>
      </div>
    </div>
  );
}

export default function TopicPage() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [quotedPost, setQuotedPost] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const { user, isApproved } = useAuth();

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
    getTopic(id).then(res => setTopic(res.data));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    getTopicPosts(id, { page, size: 15 })
      .then(res => {
        setPosts(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      })
      .finally(() => setLoading(false));
  }, [id, page]);

  const handleReply = async () => {
    if (!replyContent.trim()) return toast.error('Nội dung không được để trống!');
    setSubmitting(true);
    try {
      const data = {
        content: replyContent,
        quotedPostId: quotedPost?.id,
        quotedContent: quotedPost ? quotedPost.content.substring(0, 200) : null,
        quotedAuthorName: quotedPost?.authorName
      };
      await replyTopic(id, data);
      toast.success('Đăng bài thành công!');
      setReplyContent('');
      setQuotedPost(null);
      // Reload last page
      const res = await getTopicPosts(id, { page, size: 15 });
      setPosts(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      getTopic(id).then(r => setTopic(r.data));
    } catch (e) {
      toast.error(e.response?.data || 'Lỗi khi đăng bài!');
    } finally {
      setSubmitting(false);
    }
  };

  const cat = topic ? categories.find(c => c.id === topic.categoryId) : null;

  return (
    <div className="container">
      <div className="page-layout">
        <div className="main-content">
          <div className="breadcrumb">
            <Link to="/">🏠 Trang chủ</Link>
            <span className="breadcrumb-sep">›</span>
            {cat && <><Link to={`/category/${cat.id}`}>{cat.icon} {cat.name}</Link><span className="breadcrumb-sep">›</span></>}
            <span style={{ color: 'var(--text-primary)' }}>{topic?.title}</span>
          </div>

          {topic && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {topic.pinned && '📌 '}{topic.hot && '🔥 '}{topic.locked && '🔒 '}
                    {topic.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    bởi {topic.authorName} · 👁 {topic.viewCount} · 💬 {topic.replyCount} · ❤️ {topic.likeCount}
                  </div>
                </div>
                <div className="topic-badges">
                  {topic.pinned && <span className="badge badge-pinned">Ghim</span>}
                  {topic.hot && <span className="badge badge-hot">Hot</span>}
                  {topic.locked && <span className="badge badge-locked">Khóa</span>}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
          ) : (
            posts.map((post, i) => (
              <PostItem key={post.id} post={post} isFirst={post.isFirstPost || i === 0 && page === 0}
                onQuote={(p) => { setQuotedPost(p); window.scrollTo(0, document.body.scrollHeight); }} />
            ))
          )}

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`page-btn ${page === i ? 'active' : ''}`} onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Reply box */}
          {user && isApproved() && topic && !topic.locked && (
            <div className="card">
              <div className="card-header"><span className="card-title">✏️ Viết trả lời</span></div>
              <div style={{ padding: 14 }}>
                {quotedPost && (
                  <div className="quote-box" style={{ marginBottom: 10 }}>
                    <div className="quote-author">↩ Trích dẫn {quotedPost.authorName}:</div>
                    <div style={{ fontStyle: 'italic', fontSize: 12 }}>{quotedPost.content.substring(0, 200)}</div>
                    <button onClick={() => setQuotedPost(null)}
                      style={{ marginTop: 4, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>
                      ✕ Bỏ trích dẫn
                    </button>
                  </div>
                )}
                <textarea
                  className="form-textarea"
                  placeholder="Viết bình luận của bạn..."
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  style={{ minHeight: 100 }}
                />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn btn-primary" onClick={handleReply} disabled={submitting}>
                    {submitting ? '⏳ Đang gửi...' : '📨 Gửi bài'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {user && !isApproved() && (
            <div className="notice notice-warning">⏳ Tài khoản chưa được phê duyệt để đăng bài.</div>
          )}
          {!user && (
            <div className="notice notice-info">
              <Link to="/login">Đăng nhập</Link> để tham gia thảo luận.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
