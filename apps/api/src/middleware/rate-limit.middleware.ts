import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { ApiError } from '../utils/api-error';

// sendCommand tipi rate-limit-redis kütüphanesine uygun
type SendCommandResult = number | string;

export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000, // Token bazlı olduğu için bulk işlemleri rahatlatmak adına yüksek düzeyde tutuldu.
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: async (...args: string[]): Promise<SendCommandResult> => {
            const result = await redis.call(args[0] as string, ...args.slice(1));
            return result as SendCommandResult;
        },
    }),
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Çok fazla istek algılandı, lütfen daha sonra tekrar deneyin'));
    },
});

export const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true, // <--- SADECE başarısız girişleri (hatalı şifre vs.) sayar. Başarılı olanları (200 OK) saymaz.
    message: 'Çok fazla giriş denemesi yaptınız, 1 dakika sonra tekrar deneyiniz',
    store: new RedisStore({
        sendCommand: async (...args: string[]): Promise<SendCommandResult> => {
            const result = await redis.call(args[0] as string, ...args.slice(1));
            return result as SendCommandResult;
        },
    }),
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.'));
    },
});
