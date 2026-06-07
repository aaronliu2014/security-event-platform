import React, { useEffect } from 'react';
import { List, Button, Tag, Space, Typography, Badge, Popconfirm } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons';
import { useNotificationStore } from '../store/index';

const { Text } = Typography;

const severityColors = {
  critical: 'red', high: 'orange', medium: 'gold', low: 'green', info: 'blue',
};

function Notifications() {
  const {
    notifications, unreadCount, loading,
    loadNotifications, markRead, markAllRead, deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>
          <BellOutlined style={{ marginRight: 8 }} />
          Notifications
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ marginLeft: 8 }} />
          )}
        </h1>
        <Space>
          {unreadCount > 0 && (
            <Button icon={<CheckOutlined />} onClick={markAllRead}>
              Mark All Read
            </Button>
          )}
        </Space>
      </div>

      <List
        loading={loading}
        dataSource={notifications}
        locale={{ emptyText: 'No notifications' }}
        renderItem={(item) => (
          <List.Item
            style={{
              background: item.is_read ? 'transparent' : '#e6f7ff',
              padding: '12px 16px',
              borderRadius: 4,
              marginBottom: 4,
            }}
            actions={[
              !item.is_read && (
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  onClick={() => markRead(item.id)}
                >
                  Mark Read
                </Button>
              ),
              <Popconfirm
                title="Delete this notification?"
                onConfirm={() => deleteNotification(item.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={item.notification_type === 'email' ? <MailOutlined /> : <BellOutlined />}
              title={
                <Space>
                  <Text strong={!item.is_read}>{item.title}</Text>
                  {item.severity && (
                    <Tag color={severityColors[item.severity]}>{item.severity.toUpperCase()}</Tag>
                  )}
                </Space>
              }
              description={
                <>
                  <div>{item.message}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </Text>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}

export default Notifications;
