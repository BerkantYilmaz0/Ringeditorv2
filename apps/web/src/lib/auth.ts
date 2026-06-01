// Auth işlemleri: login, logout ve kullanıcı bilgisi alma

import { api } from './api-client';

// Backend'den dönen login yanıtı (token artık cookie üzerinden taşınıyor)
interface LoginResponse {
    twoFactorRequired?: boolean;
    preAuthToken?: string;
    user?: {
        id: string;
        username: string;
        fullName: string;
        email: string;
        createdAt: string;
        updatedAt: string;
        twoFactorEnabled?: boolean;
    };
}

// /auth/me yanıtı
interface MeResponse {
    user: {
        id: string;
        username: string;
        role: string;
        fullName?: string;
        twoFactorEnabled?: boolean;
    };
}

export type AuthUser = NonNullable<LoginResponse['user']>;

// Giriş yap
export async function login(username: string, password: string): Promise<LoginResponse> {
    const result = await api.post<LoginResponse>('/auth/login', { username, password });
    return result;
}

// 2FA Kodu Doğrula
export async function verify2FA(preAuthToken: string, code: string): Promise<LoginResponse> {
    const result = await api.post<LoginResponse>('/auth/verify-2fa', { preAuthToken, code });
    return result;
}

// Çıkış yap
export async function logout(): Promise<void> {
    try {
        await api.post<{ success: boolean }>('/auth/logout', {});
    } catch {
        // logout başarısız olsa bile frontend tarafında oturumu sonlandırılmış varsayabiliriz
    }
}

// Mevcut kullanıcıyı getir
export async function getMe(): Promise<MeResponse['user'] | null> {
    try {
        const result = await api.get<MeResponse>('/auth/me');
        return result.user;
    } catch {
        return null;
    }
}

export interface Setup2FAResponse {
    secret: string;
    otpauthUrl: string;
}

export async function setup2FA(): Promise<Setup2FAResponse> {
    return api.post<Setup2FAResponse>('/auth/2fa/setup', {});
}

export async function enable2FA(code: string): Promise<{ success: boolean; recoveryCodes: string[] }> {
    return api.post<{ success: boolean; recoveryCodes: string[] }>('/auth/2fa/enable', { code });
}

export async function disable2FA(password: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/auth/2fa/disable', { password });
}
