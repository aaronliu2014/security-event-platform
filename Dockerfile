# Build trigger: deploy latest backend code
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --only=production

COPY backend/src ./src
COPY backend/.env.example .env

EXPOSE 3000

CMD ["npm", "start"]
