import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Divider } from 'antd';
import { RadarChartOutlined } from '@ant-design/icons';
import NewsHeader from '../components/NewsHeader';
import NewsList from '../components/NewsList';
import NewsSidebar from '../components/NewsSidebar';
import { newsService, eventService } from '../services/api';
import '../styles/HomePage.css';

const { Title } = Typography;
const PAGE_SIZE = 15;

function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [articles, setArticles] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTag, setActiveTag] = useState(null);

  const fetchData = useCallback(async (p = 1, tag = null) => {
    setLoading(true);
    try {
      const [featuredRes, newsRes, tagsRes, statsRes] = await Promise.all([
        newsService.getFeatured({ limit: 5 }),
        newsService.getNews({ limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE, tag }),
        newsService.getTrendingTags({ limit: 15 }),
        eventService.getStats(),
      ]);

      setFeatured(featuredRes.data.data || []);
      setArticles(newsRes.data.data || []);
      setTotal(200); // approximate total for pagination display
      setTrendingTags(tagsRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Failed to load homepage data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, activeTag);
  }, [fetchData, page, activeTag]);

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag) => {
    if (activeTag === tag) {
      setActiveTag(null);
      setPage(1);
    } else {
      setActiveTag(tag);
      setPage(1);
    }
  };

  const handleArticleClick = (article) => {
    if (article.source_url) {
      window.open(article.source_url, '_blank');
    }
  };

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

      <Row gutter={[24, 24]}>
        {/* Main content area */}
        <Col xs={24} lg={16}>
          <NewsHeader featured={featured} loading={loading} />

          <div style={{ marginTop: 8 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              {activeTag ? `Filtered by: ${activeTag}` : 'Latest AI Security News'}
              {activeTag && (
                <span
                  style={{ marginLeft: 12, fontSize: 13, color: '#1677ff', cursor: 'pointer' }}
                  onClick={() => setActiveTag(null)}
                >
                  Clear filter
                </span>
              )}
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

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          <NewsSidebar
            trendingTags={trendingTags}
            stats={stats}
            loading={loading}
            onTagClick={handleTagClick}
          />
        </Col>
      </Row>
    </div>
  );
}

export default HomePage;
