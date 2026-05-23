import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

function Dashboard() {
  return (
    <div>
      <h1>Security Events Dashboard</h1>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Critical Issues"
              value={0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="High Risk"
              value={0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Last Update"
              value="--"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
