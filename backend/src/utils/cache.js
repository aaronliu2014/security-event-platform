import { createClient } from 'redis';
import logger from './logger.js';

let client = null;
let isConnected = false;
let connectionAttempted = false;

const DEFAULT_TTL = 300; // 5 minutes

export async function getClient() {
  if (client && isConnected) return client;
  if (!isConnected && connectionAttempted) return null;

  try {
    connectionAttempted = true;
    client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        connectTimeout: 2000,
        reconnectStrategy: false,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', () => {});

    await client.connect();
    isConnected = true;
    logger.info('Redis connected');
    return client;
  } catch (error) {
    logger.warn('Redis not available, caching disabled');
    isConnected = false;
    return null;
  }
}

export async function get(key) {
  try {
    const c = await getClient();
    if (!c) return null;
    const value = await c.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function set(key, value, ttl = DEFAULT_TTL) {
  try {
    const c = await getClient();
    if (!c) return;
    await c.set(key, JSON.stringify(value), { EX: ttl });
  } catch {
    // cache write failures are non-critical
  }
}

export async function del(key) {
  try {
    const c = await getClient();
    if (!c) return;
    await c.del(key);
  } catch {
    // ignore
  }
}

export async function delPattern(pattern) {
  try {
    const c = await getClient();
    if (!c) return;
    const keys = await c.keys(pattern);
    if (keys.length > 0) {
      await c.del(keys);
    }
  } catch {
    // ignore
  }
}

export function cacheKey(...parts) {
  return `sep:${parts.join(':')}`;
}

export default { getClient, get, set, del, delPattern, cacheKey };
