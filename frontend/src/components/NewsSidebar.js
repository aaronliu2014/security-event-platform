import React from 'react';
import { Card, Tag, Statistic, Divider, List, Typography, Alert } from 'antd';
import { FireOutlined, TagOutlined, DatabaseOutlined, ThunderboltOutlined, LockOutlined } from '@ant-design/icons';
import { topicColors, topicLabels } from './NewsCard';
import { categoryConfig } from './TopNavbar';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

function NewsSidebar({ trendingTags, stats, loading, onTagClick, activeTag }) {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'sticky', top: 80 }}>
      {/* Platform Stats - only for logged-in users */}
      {stats ? (
        <Card size="small" style={{ marginBottom: 16, borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Statistic
              title="总事件数"
              value={stats?.total_events || 0}
              valueStyle={{ fontSize: 20, color: '#1677ff' }}
              prefix={<DatabaseOutlined />}
            />
            <Statistic
              title="严重事件"
              value={stats?.critical_count || 0}
              valueStyle={{ fontSize: 20, color: '#cf1322' }}
              prefix={<ThunderboltOutlined />}
            />
          </div>
        </Card>
      ) : (
        <Alert
          message="登录后查看更多"
          description="登录即可查看统计数据、智能分析和个性化通知"
          type="info"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 16, borderRadius: 6 }}
          action={
            <a href="/login" style={{ fontSize: 12 }}>立即登录</a>
          }
        />
      )}

      {/* AI Category Navigation */}
      <Card
        size="small"
        title={<span><TagOutlined style={{ marginRight: 6 }} />AI 安全分类</span>}
        style={{ marginBottom: 16, borderRadius: 6 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <Tag
              key={key}
              color={activeTag === key ? cfg.color : undefined}
              style={{
                cursor: 'pointer',
                fontSize: 12,
                padding: '2px 8px',
                margin: 0,
                border: activeTag === key ? undefined : '1px solid #d9d9d9',
              }}
              onClick={() => onTagClick && onTagClick(key)}
            >
              {cfg.icon} {cfg.label}
            </Tag>
          ))}
        </div>
      </Card>

      {/* Trending AI Tags */}
      <Card
        size="small"
        title={<span><FireOutlined style={{ color: '#fa541c', marginRight: 6 }} />热门 AI 话题</span>}
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
                  color={topicColors[tag] || (activeTag === tag ? 'blue' : 'default')}
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
            数据采集后会自动生成 AI 话题标签
          </Text>
        )}
      </Card>

      {/* Data Sources */}
      <Card
        size="small"
        title={<span>数据来源</span>}
        style={{ borderRadius: 6 }}
      >
        <List
          size="small"
          dataSource={[
            { name: 'SimonWillison', desc: 'AI & 软件工程' },
            { name: 'SchneierOnSecurity', desc: '安全技术分析' },
            { name: 'KrebsOnSecurity', desc: '调查性安全新闻' },
            { name: 'DarkReading', desc: '网络安全资讯' },
            { name: 'BleepingComputer', desc: '科技安全新闻' },
            { name: 'TheHackerNews', desc: '信息安全新闻' },
            { name: 'SecurityWeek', desc: '企业安全新闻' },
            { name: 'TrailOfBits', desc: '安全研究' },
            { name: 'Unit42', desc: 'Palo Alto 威胁研究' },
            { name: 'OpenAI Blog', desc: 'OpenAI 官方博客' },
            { name: 'Anthropic Blog', desc: 'Anthropic 官方博客' },
            { name: 'Google AI Blog', desc: 'Google AI 研究' },
          ]}
          renderItem={(item) => (
            <List.Item style={{ padding: '4px 0', border: 'none' }}>
              <Text strong style={{ fontSize: 12 }}>{item.name}</Text>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{item.desc}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default NewsSidebar;
