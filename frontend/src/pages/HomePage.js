import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Divider, Alert, Button, Tag } from 'antd';
import { RadarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import NewsHeader from '../components/NewsHeader';
import NewsList from '../components/NewsList';
import NewsSidebar from '../components/NewsSidebar';
import { newsService, eventService } from '../services/api';
import { useAuthStore } from '../store/index';
import { categoryConfig } from '../components/TopNavbar';
import '../styles/HomePage.css';

const { Title, Text } = Typography;
const PAGE_SIZE = 15;

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [featured, setFeatured] = useState([]);
  const [articles, setArticles] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Derive activeTag directly from URL params — no separate state
  const rawTag = searchParams.get('tag');
  const activeTag = rawTag && categoryConfig[rawTag] ? rawTag : null;

  const fetchData = useCallback(async (p = 1, tag = null) => {
    setLoading(true);
    setApiError(false);
    try {
      const [featuredRes, newsRes, tagsRes, statsRes] = await Promise.all([
        newsService.getFeatured({ limit: 5 }),
        newsService.getNews({ limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE, tag }),
        newsService.getTrendingTags({ limit: 15 }),
        eventService.getStats(),
      ]);

      setFeatured(featuredRes.data.data || []);
      setArticles(newsRes.data.data || []);
      setTotal(newsRes.data.total || 0);
      setTrendingTags(tagsRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Failed to load homepage data', error);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // When tag changes, reset page and fetch. When only page changes, just fetch.
  useEffect(() => {
    setPage(1);
    fetchData(1, activeTag);
  }, [activeTag]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page > 1) fetchData(page, activeTag);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag) => {
    if (activeTag === tag) {
      setSearchParams({});
    } else {
      setSearchParams({ tag });
    }
  };

  const handleArticleClick = (article) => {
    if (article.source_url) {
      window.open(article.source_url, '_blank');
    }
  };

  const activeTagLabel = activeTag ? categoryConfig[activeTag]?.label : null;

  return (
    <div className="homepage">
      <div className="homepage-header">
        <Title level={3} style={{ margin: 0 }}>
          <RadarChartOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          AI 安全态势感知平台
        </Title>
        <span style={{ color: '#999', fontSize: 13 }}>
          Daily AI security intelligence from across the web
        </span>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {apiError && (
        <Alert
          message="无法连接到后端服务"
          description="请确保后端服务已启动（默认端口 3000），或运行 docker-compose up -d 启动全部服务。首次启动后系统会自动采集数据。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={() => fetchData(page, activeTag)}>
              <ReloadOutlined /> 重试
            </Button>
          }
        />
      )}

      {activeTag && (
        <div style={{ marginBottom: 16 }}>
          <Tag color={categoryConfig[activeTag]?.color || 'blue'} style={{ fontSize: 13, padding: '4px 12px' }}>
            {categoryConfig[activeTag]?.icon} {activeTagLabel}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            共 {total} 篇相关文章
          </Text>
          <Button
            type="link"
            size="small"
            onClick={() => setSearchParams({})}
          >
            清除筛选
          </Button>
        </div>
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={isAuthenticated ? 16 : 18}>
          <NewsHeader featured={featured} loading={loading} />

          <div style={{ marginTop: 8 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              {activeTag ? `${activeTagLabel} 相关文章` : '最新 AI 安全动态'}
            </Title>
            <NewsList
              articles={articles}
              loading={loading}
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              onArticleClick={handleArticleClick}
            />
          </div>
        </Col>

        <Col xs={24} lg={isAuthenticated ? 8 : 6}>
          <NewsSidebar
            trendingTags={trendingTags}
            stats={isAuthenticated ? stats : null}
            loading={loading}
            onTagClick={handleTagClick}
            activeTag={activeTag}
          />
        </Col>
      </Row>
    </div>
  );
}

export default HomePage;
