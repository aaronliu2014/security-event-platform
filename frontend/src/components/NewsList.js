import React from 'react';
import { Pagination, Empty, Skeleton } from 'antd';
import NewsCard from './NewsCard';

function NewsList({ articles, loading, total, page, pageSize, onPageChange, onArticleClick }) {
  if (loading) {
    return (
      <div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} active avatar paragraph={{ rows: 2 }} style={{ marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return <Empty description="No AI security news yet. Data will appear after morning collection." />;
  }

  return (
    <div>
      {articles.map((article) => (
        <NewsCard
          key={article.id || article.external_id}
          article={article}
          onClick={onArticleClick}
        />
      ))}
      {total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}

export default NewsList;
