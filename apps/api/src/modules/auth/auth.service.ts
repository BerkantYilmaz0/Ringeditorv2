import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import { LoginInput, User } from '@ring-planner/shared';
import { generateSecret, verifyTOTP } from '../../utils/totp';

export class AuthService {
    private static async generateTokens(payload: { sub: string; username: string; role: string }) {
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

        const accessToken = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(env.JWT_EXPIRES_IN)
            .sign(secret);

        const refreshToken = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
            .sign(refreshSecret);

        return { accessToken, refreshToken };
    }

    static async login(data: LoginInput): Promise<
        | { twoFactorRequired: true; preAuthToken: string }
        | { accessToken: string; refreshToken: string; user: User }
    > {
        const user = await prisma.user.findUnique({ where: { username: data.username } });
        if (!user) throw ApiError.unauthorized('Kullanıcı adı veya şifre hatalı');

        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!isValidPassword) throw ApiError.unauthorized('Kullanıcı adı veya şifre hatalı');

        if (user.twoFactorEnabled) {
            const preAuthSecret = new TextEncoder().encode(env.JWT_SECRET + "_preauth");
            const preAuthToken = await new SignJWT({ sub: user.id, preAuth: true })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('5m')
                .sign(preAuthSecret);

            return {
                twoFactorRequired: true,
                preAuthToken,
            };
        }

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        const tokens = await this.generateTokens({ sub: user.id, username: user.username, role: user.role });

        return {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role as User['role'],
                isActive: user.isActive,
                twoFactorEnabled: user.twoFactorEnabled,
                lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
        };
    }

    static async verify2FA(preAuthToken: string, code: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
        const preAuthSecret = new TextEncoder().encode(env.JWT_SECRET + "_preauth");
        
        let payload;
        try {
            ({ payload } = await jwtVerify(preAuthToken, preAuthSecret));
        } catch {
            throw ApiError.unauthorized('Doğrulama süresi dolmuş veya geçersiz token');
        }
        
        if (!payload.preAuth || !payload.sub) {
            throw ApiError.unauthorized('Geçersiz doğrulama isteği');
        }
        
        const userId = payload.sub as string;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw ApiError.unauthorized('Kullanıcı bulunamadı');
        if (!user.twoFactorSecret) {
            throw ApiError.unauthorized('2FA kurulumu tamamlanmamış');
        }
        
        // Replay attack prevention: Ensure the same code cannot be verified twice within 30 seconds
        const cacheKey = `2fa:used:${userId}:${code}`;
        const alreadyUsed = await redis.get(cacheKey);
        if (alreadyUsed) {
            throw ApiError.unauthorized('Bu kod zaten kullanıldı, lütfen uygulamanızdaki yeni kodu bekleyin');
        }

        // Verify TOTP 6-digit code
        const isValid = verifyTOTP(code, user.twoFactorSecret);
        if (!isValid) {
            throw ApiError.unauthorized('Doğrulama kodu hatalı');
        }

        // Mark code as used
        await redis.setex(cacheKey, 30, 'true');
        
        // Update last login
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        
        const tokens = await this.generateTokens({ sub: user.id, username: user.username, role: user.role });
        
        return {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role as User['role'],
                isActive: user.isActive,
                twoFactorEnabled: user.twoFactorEnabled,
                lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
        };
    }

    static async setup2FA(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw ApiError.notFound('Kullanıcı bulunamadı');

        const secret = generateSecret();
        const label = user.username;
        const issuer = 'RingPlanner';
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

        // Temporarily save pending secret in DB
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret, twoFactorEnabled: false }
        });

        return {
            secret,
            otpauthUrl
        };
    }

    static async enable2FA(userId: string, code: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw ApiError.notFound('Kullanıcı bulunamadı');
        if (!user.twoFactorSecret) {
            throw ApiError.badRequest('Önce 2FA kurulumu başlatılmalıdır');
        }

        const isValid = verifyTOTP(code, user.twoFactorSecret);
        if (!isValid) {
            throw ApiError.badRequest('Doğrulama kodu geçersiz');
        }

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });

        // 8 recovery keys
        const recoveryCodes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());
        return { success: true, recoveryCodes };
    }

    static async disable2FA(userId: string, passwordCheck: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw ApiError.notFound('Kullanıcı bulunamadı');

        const valid = await bcrypt.compare(passwordCheck, user.passwordHash);
        if (!valid) throw ApiError.badRequest('Şifreniz hatalı');

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null }
        });

        return { success: true };
    }

    static async blacklistRefreshToken(refreshToken: string): Promise<void> {
        const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
        try {
            const { payload } = await jwtVerify(refreshToken, refreshSecret);
            if (payload.exp) {
                const ttl = payload.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await redis.setex(`bl_${refreshToken}`, ttl, 'true');
                }
            }
        } catch {
            // Süresi dolmuş token zaten geçersiz, blacklist'e gerek yok
        }
    }

    static async refreshAccessToken(refreshToken: string) {
        const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

        let payload;
        try {
            ({ payload } = await jwtVerify(refreshToken, refreshSecret));
        } catch {
            throw ApiError.unauthorized('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
        }

        // Daha önce kullanılmış (blacklist'teki) refresh token kontrolü
        const isBlacklisted = await redis.get(`bl_${refreshToken}`);
        if (isBlacklisted) {
            throw ApiError.unauthorized('Oturum geçersiz, lütfen tekrar giriş yapın');
        }

        const user = await prisma.user.findUnique({ where: { id: payload.sub as string } });
        if (!user) throw ApiError.unauthorized('Geçersiz oturum');

        const tokens = await this.generateTokens({ sub: user.id, username: user.username, role: user.role });

        // Kullanılan refresh token'ı blacklist'e al (token reuse saldırısını önler)
        if (payload.exp) {
            const ttl = payload.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) {
                await redis.setex(`bl_${refreshToken}`, ttl, 'true');
            }
        }

        return tokens;
    }

    static async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('Kullanıcı bulunamadı');

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) throw Object.assign(new Error('Mevcut şifre yanlış'), { statusCode: 400 });

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashed } });
        return { success: true };
    }

    static async updateProfile(userId: string, data: { username?: string; notificationSound?: boolean; notificationBrowser?: boolean }) {
        return prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, username: true, role: true, isActive: true, notificationSound: true, notificationBrowser: true },
        });
    }
}
