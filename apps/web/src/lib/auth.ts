// Auth işlemleri: login, logout ve kullanıcı bilgisi alma

import { api } from './api-client';

// Backend'den dönen login yanıtı (token artık cookie üzerinden taşınıyor)
interface LoginResponse {
    user: {
        id: string;
        username: string;
        fullName: string;
        email: string;
        createdAt: string;
        updatedAt: string;
    };
}

// /auth/me yanıtı
interface MeResponse {
    user: {
        id: string;
        username: string;
    };
}

export type AuthUser = LoginResponse['user'];

// Giriş yap
export async function login(username: string, password: string): Promise<LoginResponse> {
    const result = await api.post<LoginResponse>('/auth/login', { username, password });
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
