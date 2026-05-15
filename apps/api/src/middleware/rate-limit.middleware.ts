import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { ApiError } from '../utils/api-error';

type SendCommandResult = number | string;

const createRedisStore = () => new RedisStore({
    sendCommand: async (...args: string[]): Promise<SendCommandResult> => {
        const result = await redis.call(args[0] as string, ...args.slice(1));
        return result as SendCommandResult;
    },
});

export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(),
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Çok fazla istek algılandı, lütfen daha sonra tekrar deneyin'));
    },
});

export const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    store: createRedisStore(),
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.'));
    },
});

export const refreshRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    store: createRedisStore(),
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Çok fazla token yenileme isteği. Lütfen daha sonra tekrar deneyin.'));
    },
});
