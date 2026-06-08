import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const redisUrl = env.REDIS_URL;

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry ${times} in ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];
    return targetErrors.some(target => err.message.includes(target));
  },
  enableAutoPipelining: true,
  lazyConnect: false,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Health check helper
export const checkRedis = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
};

export default redis;