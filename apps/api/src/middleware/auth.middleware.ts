import { Request, Response, NextFunction } from 'express';
import { jwtVerify, errors as joseErrors } from 'jose';
import { env } from '../config/env';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';

// Express Request nesnesini user modeliyle genişlet
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
            };
            token?: string;
            tokenExp?: number;
        }
    }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.access_token;

        if (!token) {
            throw ApiError.unauthorized('Oturum bulunamadı, lütfen giriş yapın');
        }

        const secret = new TextEncoder().encode(env.JWT_SECRET);

        const isBlacklisted = await redis.get(`bl_${token}`);
        if (isBlacklisted) {
            throw ApiError.unauthorized('Kullanıcı oturumu zaten sonlandırılmış (Geçersiz Token)');
        }

        try {
            const { payload } = await jwtVerify(token, secret);
            req.user = {
                id: payload.sub as string,
                username: payload.username as string,
            };
            req.token = token;
            req.tokenExp = payload.exp as number;

            next();
        } catch (err) {
            // jose kütüphanesinin hata tiplerini kullan
            if (err instanceof joseErrors.JWTExpired) {
                logger.warn('JWT süresi dolmuş');
            } else if (err instanceof joseErrors.JWTClaimValidationFailed) {
                logger.warn('JWT doğrulama hatası');
            } else if (err instanceof Error) {
                logger.warn(`JWT doğrulama hatası: ${err.message}`);
            }
            throw ApiError.unauthorized('Oturum süresi dolmuş veya token geçersiz');
        }
    } catch (error) {
        next(error);
    }
};
