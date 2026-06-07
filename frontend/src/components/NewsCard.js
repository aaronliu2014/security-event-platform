import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import { ClockCircleOutlined, LinkOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const topicColors = {
  'prompt-injection': '#f5222d',
  'llm-security': '#fa541c',
  'adversarial-attack': '#fa8c16',
  'model-stealing': '#eb2f96',
  'data-poisoning': '#722ed1',
  'ai-governance': '#2f54eb',
  'ai-red-teaming': '#13c2c2',
  'rag-security': '#52c41a',
  'ai-agent-security': '#a0d911',
  'ai-supply-chain': '#faad14',
  'ai-vulnerability': '#cf1322',
  'ai-safety-alignment': '#1890ff',
  'ai-privacy': '#7c3aed',
  'generative-ai-security': '#c41d7f',
  'ai-threat-intel': '#d4380d',
  'ai-incident': '#d48806',
};

const topicLabels = {
  'prompt-injection': 'Prompt Injection',
  'llm-security': 'LLM Security',
  'adversarial-attack': 'Adversarial Attack',
  'model-stealing': 'Model Stealing',
  'data-poisoning': 'Data Poisoning',
  'ai-governance': 'AI Governance',
  'ai-red-teaming': 'AI Red Teaming',
  'rag-security': 'RAG Security',
  'ai-agent-security': 'AI Agent Security',
  'ai-supply-chain': 'AI Supply Chain',
  'ai-vulnerability': 'AI Vulnerability',
  'ai-safety-alignment': 'AI 政策法规动态',
  'ai-privacy': 'AI Privacy',
  'generative-ai-security': 'Generative AI Security',
  'ai-threat-intel': 'AI Threat Intelligence',
  'ai-incident': 'AI Incident',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function NewsCard({ article, onClick, showThumb = true }) {
  const tags = article.tags || [];

  return (
    <div
      className="news-card"
      onClick={() => onClick && onClick(article)}
      style={{ cursor: 'pointer', marginBottom: 12 }}
    >
      <Card
        hoverable
        size="small"
        style={{ borderRadius: 6 }}
        bodyStyle={{ padding: 12 }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          {showThumb && article.thumbnail_url && (
            <div style={{ flexShrink: 0, width: 120, height: 80, overflow: 'hidden', borderRadius: 4 }}>
              <img
                src={article.thumbnail_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 15, lineHeight: 1.4 }}>
              {article.title}
            </Text>
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 8, marginTop: 4, fontSize: 13 }}
            >
              {article.description}
            </Paragraph>
            <Space size={4} wrap>
              <Tag color="blue" style={{ fontSize: 11 }}>{article.source}</Tag>
              {tags.slice(0, 3).map((tag) => (
                <Tag key={tag} color={topicColors[tag] || '#999'} style={{ fontSize: 11 }}>
                  {topicLabels[tag] || tag}
                </Tag>
              ))}
              <Text type="secondary" style={{ fontSize: 11 }}>
                <ClockCircleOutlined style={{ marginRight: 2 }} />
                {timeAgo(article.published_date)}
              </Text>
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default NewsCard;
export { topicColors, topicLabels };
