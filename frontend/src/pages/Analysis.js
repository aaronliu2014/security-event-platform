import React, { useEffect, useState } from 'react';
import { Card, Table, Progress, List, Tag, Typography, Row, Col } from 'antd';
import {
  ClusterOutlined, RiseOutlined, PieChartOutlined,
  WarningOutlined, AlertOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { analysisService } from '../services/api';

const { Title, Text } = Typography;

const severityColors = {
  critical: { color: '#cf1322', icon: <WarningOutlined /> },
  high: { color: '#fa541c', icon: <AlertOutlined /> },
  medium: { color: '#faad14', icon: <InfoCircleOutlined /> },
  low: { color: '#52c41a', icon: <InfoCircleOutlined /> },
};

function Analysis() {
  const [clusters, setClusters] = useState([]);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clustersRes, trendsRes, distRes] = await Promise.all([
          analysisService.getClusters(),
          analysisService.getTrends(),
          analysisService.getSeverityDistribution(),
        ]);
        setClusters(clustersRes.data.data || []);
        setTrends(trendsRes.data.data || []);
        setDistribution(distRes.data.data || []);
      } catch (error) {
        console.error('Failed to load analysis data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const clusterColumns = [
    { title: 'Cluster Name', dataIndex: 'cluster_name', key: 'cluster_name' },
    {
      title: 'Event Count',
      dataIndex: 'event_count',
      key: 'event_count',
      render: (v) => parseInt(v) || 0,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (s) => {
        const cfg = severityColors[s] || {};
        return <Tag color={cfg.color}>{s?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Events',
      dataIndex: 'event_ids',
      key: 'event_ids',
      ellipsis: true,
      render: (ids) => (Array.isArray(ids) ? ids.join(', ') : ids || '--'),
    },
  ];

  const totalDist = distribution.reduce((sum, d) => sum + parseInt(d.count), 0);

  return (
    <div>
      <Title level={3}>Event Analysis</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<><ClusterOutlined /> Event Clusters</>}
            loading={loading}
            style={{ height: '100%' }}
          >
            <Table
              columns={clusterColumns}
              dataSource={clusters}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: true }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<><PieChartOutlined /> Severity Distribution</>}
            loading={loading}
            style={{ height: '100%' }}
          >
            {distribution.map((item) => {
              const cfg = severityColors[item.severity] || { color: '#999', icon: null };
              const pct = totalDist > 0 ? Math.round((parseInt(item.count) / totalDist) * 100) : 0;
              return (
                <div key={item.severity} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{cfg.icon} {item.severity?.toUpperCase()}</span>
                    <Text strong>{item.count} ({pct}%)</Text>
                  </div>
                  <Progress percent={pct} strokeColor={cfg.color} showInfo={false} />
                </div>
              );
            })}
            {distribution.length === 0 && <Text type="secondary">No data available</Text>}
          </Card>
        </Col>
      </Row>

      <Card
        title={<><RiseOutlined /> Event Trends (Last 30 Days)</>}
        loading={loading}
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={trends}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.date || item.period || '--'}
                description={`Events: ${item.count || item.event_count || 0}`}
              />
              {item.severity && (
                <Tag color={severityColors[item.severity]?.color}>
                  {item.severity.toUpperCase()}
                </Tag>
              )}
            </List.Item>
          )}
          locale={{ emptyText: 'No trend data available' }}
        />
      </Card>
    </div>
  );
}

export default Analysis;
