import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        logger.warn(`Redis bağlantısı deneniyor... (${times}. deneme)`);
        return Math.min(times * 50, 2000);
    },
});

redis.on('connect', () => {
    logger.info('📦 Redis başarıyla bağlandı');
});

redis.on('error', (err) => {
    logger.error('❌ Redis Bağlantı Hatası: ', err);
});
