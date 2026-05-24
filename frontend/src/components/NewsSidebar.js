import React from 'react';
import { Card, Tag, Statistic, Divider, Skeleton, List, Typography } from 'antd';
import { FireOutlined, TagOutlined, DatabaseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { topicColors, topicLabels } from './NewsCard';

const { Text } = Typography;

function NewsSidebar({ trendingTags, stats, loading, onTagClick }) {
  return (
    <div style={{ position: 'sticky', top: 24 }}>
      {/* Platform Stats */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <Statistic
            title="Total Events"
            value={stats?.total_events || 0}
            valueStyle={{ fontSize: 20, color: '#1677ff' }}
            prefix={<DatabaseOutlined />}
          />
          <Statistic
            title="Critical"
            value={stats?.critical_count || 0}
            valueStyle={{ fontSize: 20, color: '#cf1322' }}
            prefix={<ThunderboltOutlined />}
          />
        </div>
      </Card>

      {/* Trending AI Tags */}
      <Card
        size="small"
        title={<span><FireOutlined style={{ color: '#fa541c', marginRight: 6 }} />Trending AI Topics</span>}
        style={{ marginBottom: 16, borderRadius: 6 }}
        loading={loading}
      >
        {trendingTags && trendingTags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trendingTags.map((item) => {
              const tag = item.tag_name || item.tag;
              const count = item.article_count || item.count;
              return (
                <Tag
                  key={tag}
                  color={topicColors[tag] || 'default'}
                  style={{ cursor: 'pointer', fontSize: 12, padding: '2px 8px', margin: 0 }}
                  onClick={() => onTagClick && onTagClick(tag)}
                >
                  {topicLabels[tag] || tag} ({count})
                </Tag>
              );
            })}
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            AI topic tags will appear after the first news collection.
          </Text>
        )}
      </Card>

      {/* Data Sources */}
      <Card
        size="small"
        title={<span><TagOutlined style={{ marginRight: 6 }} />Data Sources</span>}
        style={{ borderRadius: 6 }}
      >
        <List
          size="small"
          dataSource={[
            { name: 'TheHackersNews', desc: 'General security news' },
            { name: 'BleepingComputer', desc: 'Security & tech news' },
            { name: 'TheRecord', desc: 'Cyber threat intelligence' },
            { name: 'EmbraceTheRed', desc: 'AI red teaming & security' },
            { name: 'SimonWillison', desc: 'AI & software security' },
            { name: 'NVD / CISA', desc: 'Vulnerability databases' },
          ]}
          renderItem={(item) => (
            <List.Item style={{ padding: '4px 0', border: 'none' }}>
              <Text strong style={{ fontSize: 12 }}>{item.name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default NewsSidebar;
