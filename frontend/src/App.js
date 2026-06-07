import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import TopNavbar from './components/TopNavbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import EventList from './pages/EventList';
import Analysis from './pages/Analysis';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import { useAuthStore, useNotificationStore } from './store/index';
import './styles/App.css';

function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadNotifications = useNotificationStore((s) => s.loadNotifications);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, loadNotifications]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <TopNavbar />
      <Layout>
        {isAuthenticated && <Sidebar />}
        <Layout.Content
          style={{
            padding: '24px',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/stats" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/analysis" element={
              <ProtectedRoute><Analysis /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

const routerBasename = process.env.NODE_ENV === 'production' ? '/security-event-platform' : undefined;

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, []);

  return (
    <Router basename={routerBasename}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
