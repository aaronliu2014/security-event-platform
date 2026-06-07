import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined, FileTextOutlined, BarChartOutlined,
  BellOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/index';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotificationStore();

  const menuItems = [
    { key: '/stats', icon: <DashboardOutlined />, label: '控制面板' },
    { key: '/events', icon: <FileTextOutlined />, label: '安全事件' },
    { key: '/analysis', icon: <BarChartOutlined />, label: '智能分析' },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: unreadCount > 0 ? `通知 (${unreadCount})` : '通知',
    },
    { key: '/settings', icon: <SettingOutlined />, label: '设置' },
  ];

  return (
    <Layout.Sider
      width={200}
      breakpoint="lg"
      collapsible
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div style={{
        padding: '12px 16px',
        fontSize: 13,
        color: '#999',
        borderBottom: '1px solid #f0f0f0',
      }}>
        管理导航
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      />
    </Layout.Sider>
  );
}

export default Sidebar;
