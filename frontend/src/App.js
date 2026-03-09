import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CategoryPage from './pages/CategoryPage';
import TopicPage from './pages/TopicPage';
import NewTopicPage from './pages/NewTopicPage';
import SearchPage from './pages/SearchPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTopics from './pages/admin/AdminTopics';
import AdminCategories from './pages/admin/AdminCategories';
import StoryListPage from './pages/StoryListPage';
import StoryDetailPage from './pages/StoryDetailPage';
import ChapterReadPage from './pages/ChapterReadPage';
import AdminStories from './pages/admin/AdminStories';
import AdminStoryChapters from './pages/admin/AdminStoryChapters';

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin()) return <Navigate to="/" />;
  return children;
};

function AppContent() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/topic/:id" element={<TopicPage />} />
        <Route path="/new-topic" element={<NewTopicPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/stories" element={<StoryListPage />} />
        <Route path="/stories/:id" element={<StoryDetailPage />} />
        <Route path="/stories/:id/chapters/:chapterNumber" element={<ChapterReadPage />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="topics" element={<AdminTopics />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="stories/:storyId/chapters" element={<AdminStoryChapters />} />
        </Route>
      </Routes>
      <ToastContainer
        position="bottom-right"
        theme="dark"
        autoClose={3000}
        toastStyle={{ background: '#1e1e24', border: '1px solid #2a2a33', color: '#e8e8ec' }}
      />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
