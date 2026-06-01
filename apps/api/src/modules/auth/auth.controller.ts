import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseFormatter } from '../../utils/api-response';
import { LoginInput, User } from '@ring-planner/shared';
import { redis } from '../../config/redis';
import { ApiError } from '../../utils/api-error';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    path: '/',
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
};

export class AuthController {

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const data: LoginInput = req.body;
            const result = await AuthService.login(data);

            if ('twoFactorRequired' in result && result.twoFactorRequired) {
                res.json(ResponseFormatter.success({
                    twoFactorRequired: true,
                    preAuthToken: result.preAuthToken
                }));
                return;
            }

            const { accessToken, refreshToken, user } = result as { accessToken: string; refreshToken: string; user: User };

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

    static async verify2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const { preAuthToken, code } = req.body as { preAuthToken: string; code: string };

            if (!preAuthToken || !code) {
                throw ApiError.badRequest('Geçersiz doğrulama bilgileri');
            }

            const { accessToken, refreshToken, user } = await AuthService.verify2FA(preAuthToken, code);

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

            // Refresh token'ı da blacklist'e al
            const refreshToken = req.cookies.refresh_token;
            if (refreshToken) {
                await AuthService.blacklistRefreshToken(refreshToken);
            }

            res.clearCookie('access_token', COOKIE_OPTIONS);
            res.clearCookie('refresh_token', COOKIE_OPTIONS);

            res.json(ResponseFormatter.success({ success: true, message: "Başarıyla çıkış yapıldı." }));
        } catch (error) {
            next(error);
        }
    }

    static async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.updateProfile(req.user!.id, req.body);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async setup2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.setup2FA(req.user!.id);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async enable2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const { code } = req.body;
            const result = await AuthService.enable2FA(req.user!.id, code);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async disable2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const { password } = req.body;
            const result = await AuthService.disable2FA(req.user!.id, password);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
