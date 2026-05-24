import React, { useEffect } from 'react';
import { Layout, Menu, Badge, Button, Space, Typography, Tag } from 'antd';
import {
  DashboardOutlined, FileTextOutlined, SettingOutlined,
  BarChartOutlined, BellOutlined, LogoutOutlined, UserOutlined,
  LoginOutlined, UserAddOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store/index';

const { Text } = Typography;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/events',
      icon: <FileTextOutlined />,
      label: 'Events',
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: 'Analysis',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: (
        <Space>
          Notifications
          {isAuthenticated && unreadCount > 0 && <Badge count={unreadCount} size="small" />}
        </Space>
      ),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  return (
    <Layout.Sider
      breakpoint="lg"
      collapsedWidth={0}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      <div style={{
        padding: '16px', color: 'white', fontWeight: 'bold',
        fontSize: '16px', textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        Security Events
      </div>

      {!isAuthenticated && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Tag color="blue" style={{ marginBottom: 8, width: '100%', textAlign: 'center' }}>
            Guest Mode
          </Tag>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              block
              size="small"
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
            <Button
              icon={<UserAddOutlined />}
              block
              size="small"
              ghost
              style={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Space>
        </div>
      )}

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      />

      {isAuthenticated && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <UserOutlined style={{ color: 'rgba(255,255,255,0.65)' }} />
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                {user?.username || user?.email || 'User'}
              </Text>
            </Space>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
            style={{ color: 'rgba(255,255,255,0.65)', textAlign: 'left' }}
          >
            Logout
          </Button>
        </div>
      )}
    </Layout.Sider>
  );
}

export default Sidebar;
