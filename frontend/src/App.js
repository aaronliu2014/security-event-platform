import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import Sidebar from './components/Sidebar';
import EventList from './pages/EventList';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import './styles/App.css';

function App() {
  const [loading, setLoading] = React.useState(false);

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout.Content style={{ padding: '24px' }}>
          <Spin spinning={loading}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<EventList />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Spin>
        </Layout.Content>
      </Layout>
    </Router>
  );
}

export default App;
