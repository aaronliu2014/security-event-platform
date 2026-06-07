import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Typography } from 'antd';
import {
  ThunderboltOutlined, WarningOutlined, AlertOutlined,
  InfoCircleOutlined, ClockCircleOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import { eventService, analysisService } from '../services/api';

const { Title } = Typography;

const severityConfig = {
  critical: { color: '#cf1322', icon: <WarningOutlined />, label: 'Critical' },
  high: { color: '#fa541c', icon: <AlertOutlined />, label: 'High' },
  medium: { color: '#faad14', icon: <InfoCircleOutlined />, label: 'Medium' },
  low: { color: '#52c41a', icon: <InfoCircleOutlined />, label: 'Low' },
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, distRes] = await Promise.all([
          eventService.getStats(),
          analysisService.getSeverityDistribution(),
        ]);
        setStats(statsRes.data.data);
        setDistribution(distRes.data.data);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = stats ? parseInt(stats.total_events) || 0 : 0;

  return (
    <div>
      <Title level={3}>Security Events Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Events"
              value={stats?.total_events || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Critical"
              value={stats?.critical_count || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="High Risk"
              value={stats?.high_count || 0}
              valueStyle={{ color: '#fa541c' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Data Sources"
              value={stats?.total_sources || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Medium"
              value={stats?.medium_count || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Low"
              value={stats?.low_count || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Last Collection"
              value={stats?.last_collection ? new Date(stats.last_collection).toLocaleDateString() : '--'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Latest Event"
              value={stats?.latest_event ? new Date(stats.latest_event).toLocaleDateString() : '--'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {distribution && distribution.length > 0 && (
        <Card title="Severity Distribution" style={{ marginTop: 16 }} loading={loading}>
          {distribution.map((item) => {
            const cfg = severityConfig[item.severity] || { color: '#999', label: item.severity };
            const pct = total > 0 ? Math.round((parseInt(item.count) / total) * 100) : 0;
            return (
              <div key={item.severity} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{cfg.icon} {cfg.label}</span>
                  <span>{item.count} ({pct}%)</span>
                </div>
                <Progress percent={pct} strokeColor={cfg.color} showInfo={false} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
