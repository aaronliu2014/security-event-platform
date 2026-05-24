import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

let wss = null;
const clients = new Map(); // userId -> Set<WebSocket>

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId;

      if (!clients.has(userId)) {
        clients.set(userId, new Set());
      }
      clients.get(userId).add(ws);

      logger.info(`WebSocket client connected: user=${userId}`);

      ws.on('close', () => {
        const userSockets = clients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) clients.delete(userId);
        }
        logger.info(`WebSocket client disconnected: user=${userId}`);
      });

      ws.on('error', () => {
        const userSockets = clients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) clients.delete(userId);
        }
      });

      ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
    } catch (err) {
      ws.close(4003, 'Invalid token');
    }
  });

  logger.info('WebSocket server initialized');
  return wss;
}

export function sendToUser(userId, data) {
  const userSockets = clients.get(userId);
  if (!userSockets || userSockets.size === 0) return false;

  const message = JSON.stringify(data);
  let sent = false;
  for (const ws of userSockets) {
    if (ws.readyState === 1) {
      ws.send(message);
      sent = true;
    }
  }
  return sent;
}

export function broadcastToAll(data) {
  const message = JSON.stringify(data);
  let count = 0;
  for (const [, sockets] of clients) {
    for (const ws of sockets) {
      if (ws.readyState === 1) {
        ws.send(message);
        count++;
      }
    }
  }
  return count;
}

export function getClientCount() {
  let count = 0;
  for (const [, sockets] of clients) {
    count += sockets.size;
  }
  return count;
}

export default { initWebSocket, sendToUser, broadcastToAll, getClientCount };
