import React from 'react';
import { Layout, Menu, Button, Space, Dropdown, Avatar, Badge, Typography } from 'antd';
import {
  HomeOutlined, LoginOutlined, UserAddOutlined, UserOutlined,
  DashboardOutlined, BellOutlined, SettingOutlined, LogoutOutlined,
  SafetyCertificateOutlined, BugOutlined, SecurityScanOutlined, LockOutlined,
  RobotOutlined, AlertOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store/index';

const { Text } = Typography;

const categoryConfig = {
  'ai-vulnerability': { label: 'AI 安全漏洞', icon: <BugOutlined />, color: '#cf1322' },
  'ai-safety-alignment': { label: 'AI 政策法规动态', icon: <SafetyCertificateOutlined />, color: '#1890ff' },
  'ai-privacy': { label: 'AI 隐私', icon: <LockOutlined />, color: '#7c3aed' },
  'generative-ai-security': { label: '生成式 AI 安全', icon: <RobotOutlined />, color: '#c41d7f' },
  'ai-threat-intel': { label: 'AI 威胁情报', icon: <AlertOutlined />, color: '#d4380d' },
  'ai-incident': { label: 'AI 安全事件', icon: <ThunderboltOutlined />, color: '#d48806' },
};

function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      key: '/stats',
      icon: <DashboardOutlined />,
      label: '控制面板',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: `通知 ${unreadCount > 0 ? `(${unreadCount})` : ''}`,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const currentTag = new URLSearchParams(location.search).get('tag');

  const topMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    ...Object.entries(categoryConfig).map(([key, cfg]) => ({
      key: `/?tag=${key}`,
      icon: cfg.icon,
      label: cfg.label,
    })),
  ];

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#001529',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 56,
        lineHeight: '56px',
      }}
    >
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
        onClick={() => navigate('/')}
      >
        <SecurityScanOutlined style={{ fontSize: 22, color: '#1677ff', marginRight: 8 }} />
        <Text strong style={{ color: '#fff', fontSize: 16, whiteSpace: 'nowrap' }}>
          AI Security Intel
        </Text>
      </div>

      {/* Category Menu */}
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[currentTag ? `/?tag=${currentTag}` : '/']}
        items={topMenuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
          background: 'transparent',
          borderBottom: 'none',
        }}
        overflowedIndicator={null}
      />

      {/* User Area */}
      <div style={{ flexShrink: 0 }}>
        {isAuthenticated ? (
          <Space>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout();
                  else navigate(key);
                },
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer', color: '#fff' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  {user?.username || user?.email || 'User'}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        ) : (
          <Space>
            <Button type="primary" icon={<LoginOutlined />} size="small" onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button
              ghost
              icon={<UserAddOutlined />}
              size="small"
              onClick={() => navigate('/register')}
              style={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              注册
            </Button>
          </Space>
        )}
      </div>
    </Layout.Header>
  );
}

export { categoryConfig };
export default TopNavbar;
