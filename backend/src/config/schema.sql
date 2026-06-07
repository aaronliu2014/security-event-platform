-- Events table: Core data for security events
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(100) NOT NULL,
    source_url VARCHAR(500),
    event_type VARCHAR(50),
    severity VARCHAR(20),
    affected_products TEXT[],
    published_date TIMESTAMP,
    collected_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB,
    thumbnail_url VARCHAR(1000),
    ai_relevance_score FLOAT DEFAULT 0,
    content_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source_date ON events (source, published_date);
CREATE INDEX IF NOT EXISTS idx_severity ON events (severity);
CREATE INDEX IF NOT EXISTS idx_event_type ON events (event_type);
CREATE INDEX IF NOT EXISTS idx_ai_relevance ON events (ai_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_event_type_date ON events (event_type, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_content_hash ON events (content_hash);

-- Event clusters: Group related events together
CREATE TABLE IF NOT EXISTS event_clusters (
    id SERIAL PRIMARY KEY,
    cluster_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_ids INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cluster_name ON event_clusters (cluster_name);

-- Users table: User account management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email ON users (email);

-- User preferences: Store user-specific settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_frequency VARCHAR(50) DEFAULT 'daily',
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_severity_threshold VARCHAR(20) DEFAULT 'medium',
    data_sources TEXT[],
    custom_filters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Collection tasks: Track data collection status
CREATE TABLE IF NOT EXISTS collection_tasks (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(100),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    last_run_date TIMESTAMP,
    next_run_date TIMESTAMP,
    items_processed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_name, source)
);

CREATE INDEX IF NOT EXISTS idx_source_status ON collection_tasks (source, status);
CREATE INDEX IF NOT EXISTS idx_next_run ON collection_tasks (next_run_date);

-- Notifications: Store notification records
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id),
    notification_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_unread ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_sent_date ON notifications (sent_at);

-- Event tags: For flexible categorization
CREATE TABLE IF NOT EXISTS event_tags (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tag_name ON event_tags (tag_name);
CREATE INDEX IF NOT EXISTS idx_tag_event ON event_tags (event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_tag_unique ON event_tags (event_id, tag_name);
