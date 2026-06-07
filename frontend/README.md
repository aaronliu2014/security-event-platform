# Security Event Platform - Frontend

## Overview
React-based frontend for security event collection and analysis platform

## Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/               # Page components
│   ├── services/            # API service layer
│   ├── store/               # State management (Zustand)
│   ├── utils/               # Utility functions
│   ├── styles/              # CSS stylesheets
│   ├── App.js               # Root component
│   └── index.js             # Application entry point
├── public/                  # Static files
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
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:3000/api
EOF
```

### 3. Run Development Server
```bash
npm start
```

Application will open at `http://localhost:3000`

## Technologies Used
- **React** - UI framework
- **React Router** - Client-side routing
- **Ant Design** - UI component library
- **Zustand** - State management
- **Axios** - HTTP client

## Features
- Dashboard with security event statistics
- Event list with search and filtering
- User preferences/settings management
- Responsive design
