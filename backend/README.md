# Security Event Platform - Backend

## Overview
Node.js + Express backend for security event collection and analysis

## Project Structure
```
backend/
├── src/
│   ├── index.js              # Application entry point
│   ├── config/               # Configuration files
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic
│   ├── models/               # Data models
│   ├── middleware/           # Custom middleware
│   ├── tasks/                # Scheduled tasks
│   └── utils/                # Utility functions
├── tests/                    # Test files
├── logs/                     # Log files (generated)
├── .env.example              # Environment variables template
├── package.json
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

### Events (Coming Soon)
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `GET /api/events/search` - Search events

### Users (Coming Soon)
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

## Technologies Used
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching
- **Node Cron** - Task scheduling
- **Axios** - HTTP client
- **Winston** - Logging
