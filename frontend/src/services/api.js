import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';

export const api = axios.create({ baseURL: API });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Categories
export const getCategories = () => api.get('/api/categories');

// Topics
export const getTopics = (params) => api.get('/api/topics', { params });
export const getTopic = (id) => api.get(`/api/topics/${id}`);
export const getTopicPosts = (id, params) => api.get(`/api/topics/${id}/posts`, { params });
export const createTopic = (data) => api.post('/api/topics', data);
export const replyTopic = (id, data) => api.post(`/api/topics/${id}/posts`, data);
export const likeTopic = (id) => api.post(`/api/topics/${id}/like`);
export const getHotTopics = () => api.get('/api/topics/hot');
export const getLatestTopics = () => api.get('/api/topics/latest');
export const searchTopics = (q, params) => api.get('/api/topics/search', { params: { q, ...params } });

// Auth
export const changePassword = (data) => api.post('/api/auth/change-password', data);

// Admin
export const adminGetStats = () => api.get('/api/admin/stats');
export const adminGetMemberStats = () => api.get('/api/admin/stats/members');
export const adminGetUsers = (params) => api.get('/api/admin/users', { params });
export const adminApproveUser = (id) => api.post(`/api/admin/users/${id}/approve`);
export const adminRejectUser = (id) => api.post(`/api/admin/users/${id}/reject`);
export const adminBanUser = (id, reason) => api.post(`/api/admin/users/${id}/ban`, { reason });
export const adminGetPendingTopics = (params) => api.get('/api/admin/topics/pending', { params });
export const adminApproveTopic = (id) => api.post(`/api/admin/topics/${id}/approve`);
export const adminRejectTopic = (id) => api.post(`/api/admin/topics/${id}/reject`);
export const adminPinTopic = (id) => api.post(`/api/admin/topics/${id}/pin`);
export const adminLockTopic = (id) => api.post(`/api/admin/topics/${id}/lock`);
export const adminHotTopic = (id) => api.post(`/api/admin/topics/${id}/hot`);
export const adminDeleteTopic = (id) => api.delete(`/api/admin/topics/${id}`);
export const adminGetPendingPosts = (params) => api.get('/api/admin/posts/pending', { params });
export const adminApprovePost = (id) => api.post(`/api/admin/posts/${id}/approve`);
export const adminRejectPost = (id) => api.post(`/api/admin/posts/${id}/reject`);
export const adminMakeMod = (id) => api.post(`/api/admin/users/${id}/make-mod`);
export const adminRemoveMod = (id) => api.post(`/api/admin/users/${id}/remove-mod`);
export const adminMakeAdmin = (id) => api.post(`/api/admin/users/${id}/make-admin`);
export const adminCreateCategory = (data) => api.post('/api/categories', data);
export const adminUpdateCategory = (id, data) => api.put(`/api/categories/${id}`, data);
export const adminDeleteCategory = (id) => api.delete(`/api/categories/${id}`);

// Stories
export const getStories = (params) => api.get('/api/stories', { params });
export const getStory = (id) => api.get(`/api/stories/${id}`);
export const getStoryChapters = (id, params) => api.get(`/api/stories/${id}/chapters`, { params });
export const getAllChaptersMeta = (id) => api.get(`/api/stories/${id}/chapters/all`);
export const readChapter = (storyId, chapterNumber) => api.get(`/api/stories/${storyId}/chapters/${chapterNumber}/read`);
export const getChapterForEdit = (storyId, chapterId) => api.get(`/api/stories/${storyId}/chapters/${chapterId}/edit`);
export const adminCreateStory = (data) => api.post('/api/stories', data);
export const adminUpdateStory = (id, data) => api.put(`/api/stories/${id}`, data);
export const adminDeleteStory = (id) => api.delete(`/api/stories/${id}`);
export const adminAddChapter = (storyId, data) => api.post(`/api/stories/${storyId}/chapters`, data);
export const adminUpdateChapter = (storyId, chapterId, data) => api.put(`/api/stories/${storyId}/chapters/${chapterId}`, data);
export const adminDeleteChapter = (storyId, chapterId) => api.delete(`/api/stories/${storyId}/chapters/${chapterId}`);

// Chapter comments
export const getChapterComments = (storyId, chapterNumber, params) => api.get(`/api/stories/${storyId}/chapters/${chapterNumber}/comments`, { params });
export const addChapterComment = (storyId, chapterNumber, data) => api.post(`/api/stories/${storyId}/chapters/${chapterNumber}/comments`, data);

// Notifications
export const getNotifications = (params) => api.get('/api/notifications', { params });
export const getUnreadCount = () => api.get('/api/notifications/unread-count');
export const markNotificationRead = (id) => api.post(`/api/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/api/notifications/read-all');

// User profile
export const getUserProfile = (username) => api.get(`/api/users/${username}`);
export const updateMyProfile = (data) => api.put('/api/users/me', data);

// Library (bookmark + history)
export const getBookmarks = () => api.get('/api/library/bookmarks');
export const toggleBookmark = (data) => api.post('/api/library/bookmarks', data);
export const removeBookmark = (storyId) => api.delete(`/api/library/bookmarks/${storyId}`);
export const checkBookmark = (storyId) => api.get(`/api/library/bookmarks/${storyId}/exists`);
export const getHistory = (params) => api.get('/api/library/history', { params });
export const recordHistory = (data) => api.post('/api/library/history', data);
export const clearHistory = () => api.delete('/api/library/history');
