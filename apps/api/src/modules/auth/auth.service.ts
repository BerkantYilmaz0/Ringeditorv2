import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import { LoginInput } from '@ring-planner/shared';

export class AuthService {
    private static async generateTokens(payload: { sub: string; username: string }) {
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

    static async login(data: LoginInput) {
        const user = await prisma.user.findUnique({ where: { username: data.username } });
        if (!user) throw ApiError.unauthorized('Kullanıcı adı veya şifre hatalı');

        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!isValidPassword) throw ApiError.unauthorized('Kullanıcı adı veya şifre hatalı');

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        const tokens = await this.generateTokens({ sub: user.id, username: user.username });

        return {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
        };
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

        const tokens = await this.generateTokens({ sub: user.id, username: user.username });

        // Kullanılan refresh token'ı blacklist'e al (token reuse saldırısını önler)
        if (payload.exp) {
            const ttl = payload.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) {
                await redis.setex(`bl_${refreshToken}`, ttl, 'true');
            }
        }

        return tokens;
    }
}
