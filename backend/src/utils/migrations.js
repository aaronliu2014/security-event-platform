import pool from './database.js';
import logger from './logger.js';

const migrations = [
  {
    name: 'add_news_columns',
    sql: [
      `ALTER TABLE events ADD COLUMN thumbnail_url VARCHAR(1000)`,
      `ALTER TABLE events ADD COLUMN ai_relevance_score FLOAT DEFAULT 0`,
      `ALTER TABLE events ADD COLUMN content_hash VARCHAR(64)`,
    ],
  },
  {
    name: 'add_news_indexes',
    sql: [
      `CREATE INDEX IF NOT EXISTS idx_ai_relevance ON events (ai_relevance_score DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_event_type_date ON events (event_type, published_date DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_content_hash ON events (content_hash)`,
    ],
  },
  {
    name: 'add_event_tags_unique',
    sql: [
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_event_tag_unique ON event_tags (event_id, tag_name)`,
    ],
  },
];

export async function runMigrations() {
  logger.info('Running database migrations...');

  for (const migration of migrations) {
    for (const sql of migration.sql) {
      try {
        await pool.query(sql);
      } catch (error) {
        if (
          error.message.includes('duplicate column') ||
          error.message.includes('already exists') ||
          error.message.includes('Duplicate column')
        ) {
          logger.info(`Migration ${migration.name}: already applied, skipping`);
          continue;
        }
        logger.warn(`Migration ${migration.name} warning: ${error.message}`);
      }
    }
    logger.info(`Migration ${migration.name}: completed`);
  }

  logger.info('All migrations completed');
}

export default { runMigrations };
