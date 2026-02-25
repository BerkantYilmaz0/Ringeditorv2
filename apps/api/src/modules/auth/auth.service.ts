import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import { LoginInput } from '@ring-planner/shared';

export class AuthService {
    /**
     * Token oluşturma yardımcı metodu
     */
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

    /**
     * Kullanıcı giriş kontrolü ve Token oluşturma
     */
    static async login(data: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { username: data.username },
        });

        if (!user) {
            throw ApiError.unauthorized('Kullanıcı adı veya şifre hatalı');
        }

        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

        if (!isValidPassword) {
            throw ApiError.unauthorized('Kullanıcı adı veya şifre hatalı');
        }

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

    /**
     * Refresh Token ile yeni Access Token oluşturma
     */
    static async refreshAccessToken(refreshToken: string) {
        try {
            const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
            const { payload } = await jwtVerify(refreshToken, secret);

            const user = await prisma.user.findUnique({
                where: { id: payload.sub as string },
            });

            if (!user) {
                throw ApiError.unauthorized('Geçersiz oturum');
            }

            return this.generateTokens({ sub: user.id, username: user.username });
        } catch (error) {
            throw ApiError.unauthorized('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
        }
    }
}
