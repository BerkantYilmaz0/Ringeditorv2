import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseFormatter } from '../../utils/api-response';
import { LoginInput } from '@ring-planner/shared';
import { redis } from '../../config/redis';
import { ApiError } from '../../utils/api-error';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
};

export class AuthController {

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const data: LoginInput = req.body;
            const { accessToken, refreshToken, user } = await AuthService.login(data);

            res.cookie('access_token', accessToken, {
                ...COOKIE_OPTIONS,
                maxAge: 15 * 60 * 1000, // 15 dakika
            });

            res.cookie('refresh_token', refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
            });

            res.json(ResponseFormatter.success({ user }));
        } catch (error) {
            next(error);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = req.cookies.refresh_token;

            if (!refreshToken) {
                throw ApiError.unauthorized('Refresh token bulunamadı');
            }

            const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshAccessToken(refreshToken);

            res.cookie('access_token', accessToken, {
                ...COOKIE_OPTIONS,
                maxAge: 15 * 60 * 1000,
            });

            res.cookie('refresh_token', newRefreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json(ResponseFormatter.success({ success: true }));
        } catch (error) {
            next(error);
        }
    }

    static async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            res.json(ResponseFormatter.success({ user }));
        } catch (error) {
            next(error);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.token;
            const exp = req.tokenExp;

            if (token && exp) {
                const ttl = exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await redis.setex(`bl_${token}`, ttl, 'true');
                }
            }

            res.clearCookie('access_token', COOKIE_OPTIONS);
            res.clearCookie('refresh_token', COOKIE_OPTIONS);

            res.json(ResponseFormatter.success({ success: true, message: "Başarıyla çıkış yapıldı." }));
        } catch (error) {
            next(error);
        }
    }
}
