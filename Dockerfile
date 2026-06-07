# Build trigger: deploy latest backend code
FROM node:18-alpine

WORKDIR /app

# Install build dependencies for sql.js
RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./

RUN npm ci --only=production

COPY backend/src ./src
COPY backend/.env.production .env

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DB_PATH=/app/data/local.db
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
