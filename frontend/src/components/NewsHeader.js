import React from 'react';
import { Row, Col, Card, Tag, Typography, Skeleton } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { topicColors, topicLabels } from './NewsCard';

const { Text, Paragraph } = Typography;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function FeaturedCard({ article, large }) {
  if (!article) return <Skeleton active paragraph={{ rows: 4 }} />;

  const tags = article.tags || [];

  return (
    <Card
      hoverable
      className="featured-card"
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        height: large ? 340 : 160,
        position: 'relative',
        background: article.thumbnail_url
          ? `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), url(${article.thumbnail_url}) center/cover`
          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
      bodyStyle={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        background: 'transparent',
      }}
      onClick={() => article.source_url && window.open(article.source_url, '_blank')}
    >
      <div style={{ color: '#fff' }}>
        <div style={{ marginBottom: 8 }}>
          {tags.slice(0, 2).map((tag) => (
            <Tag key={tag} color={topicColors[tag] || '#999'} style={{ fontSize: 11 }}>
              {topicLabels[tag] || tag}
            </Tag>
          ))}
        </div>
        <Text
          style={{
            color: '#fff',
            fontSize: large ? 20 : 15,
            fontWeight: 600,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: large ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.title}
        </Text>
        {large && article.description && (
          <Paragraph
            style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4, marginTop: 4, fontSize: 13 }}
            ellipsis={{ rows: 2 }}
          >
            {article.description}
          </Paragraph>
        )}
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 }}>
          <Tag color="blue" style={{ fontSize: 10 }}>{article.source}</Tag>
          <ClockCircleOutlined style={{ marginRight: 2 }} />
          {timeAgo(article.published_date)}
        </div>
      </div>
    </Card>
  );
}

function NewsHeader({ featured, loading }) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={14}>
        <FeaturedCard article={featured[0]} large />
      </Col>
      <Col xs={24} md={10}>
        <Row gutter={[0, 16]}>
          <Col span={24}>
            <FeaturedCard article={featured[1]} />
          </Col>
          <Col span={24}>
            <FeaturedCard article={featured[2]} />
          </Col>
        </Row>
      </Col>
    </Row>
  );
}

export default NewsHeader;
