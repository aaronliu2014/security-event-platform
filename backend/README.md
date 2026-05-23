# Security Event Platform - Backend

## Overview
Node.js + Express backend for security event collection and analysis

## Project Structure
```
backend/
├── src/
│   ├── index.js              # Application entry point
│   ├── config/               # Configuration files
│   │   ├── index.js          # Config loader
│   │   └── schema.sql        # Database schema
│   ├── routes/               # API route handlers
│   │   ├── events.js         # Event list/search/stats APIs
│   │   └── admin.js          # Admin/collection management APIs
│   ├── services/             # Business logic
│   │   ├── eventCollector.js # Data collection from sources
│   │   └── eventService.js   # Database operations
│   ├── tasks/                # Scheduled tasks
│   │   └── collectionScheduler.js # Data collection scheduler
│   └── utils/                # Utility functions
│       ├── logger.js         # Winston logger setup
│       └── database.js       # PostgreSQL connection pool
├── tests/                    # Test files
├── logs/                     # Log files (generated)
├── .env.example              # Environment variables template
├── package.json
├── Dockerfile
└── README.md
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

### 3. Initialize Database
```bash
# Create PostgreSQL database
createdb security_events

# Apply schema
psql security_events < src/config/schema.sql
```

### 4. Run Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check server health status

### Events
- `GET /api/events` - List all events with optional filtering
  - Query params: `limit`, `offset`, `severity`, `source`, `eventType`, `sortBy`, `sortOrder`
- `GET /api/events/:id` - Get event details
- `GET /api/events/search` - Search events by keyword
  - Query params: `q` (search query), `limit`
- `GET /api/events/stats` - Get event statistics
- `GET /api/events/source/:source` - Get events by source

### Admin/System
- `GET /api/admin/health` - System health check
- `GET /api/admin/collection/status` - Get data collection task status
- `POST /api/admin/collection/run` - Manually trigger data collection
- `POST /api/admin/collection/schedule` - Update collection frequency
  - Body: `{ "frequency": "daily" | "weekly" | "hourly" | ... }`
- `POST /api/admin/collection/stop` - Stop scheduled collection

## Data Collection

### Supported Sources
- **NVD (National Vulnerability Database)** - Official NIST vulnerability data
- **CISA (Cybersecurity & Infrastructure Security Agency)** - Known exploited vulnerabilities
- **RSS Feeds** - Security news and updates (extensible)

### Collection Frequency
Configure via `COLLECTION_FREQUENCY` environment variable:
- `hourly` - Every hour
- `every-4-hours` - Every 4 hours
- `daily` - Every day (default)
- `twice-daily` - Twice per day
- `weekly` - Every Sunday
- `monthly` - First day of month

### Event Normalization
All events are normalized to a standard format with:
- `external_id` - Source-specific ID
- `title` - Event title
- `description` - Full description
- `source` - Data source (NVD, CISA, RSS)
- `event_type` - Category (vulnerability, advisory, etc.)
- `severity` - Risk level (critical, high, medium, low)
- `published_date` - Original publication date
- `data` - Source-specific metadata as JSON

## Technologies Used
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching (prepared)
- **Node Cron** - Task scheduling
- **Axios** - HTTP client
- **Winston** - Logging

## Testing
```bash
npm test
```

## Logging
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output in development mode

## Performance
- Database queries use connection pooling
- Event deduplication via `external_id` unique constraint
- Pagination support to prevent memory overflow
- Rate limiting on API calls to external services

