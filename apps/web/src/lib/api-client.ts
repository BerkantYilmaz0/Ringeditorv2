// Backend API ile iletişimi yöneten fetch wrapper

const getApiBaseUrl = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    // Railway tırnaklarını temizle ve boşlukları at
    url = url.replace(/['"]+/g, '').trim();

    // Protokol kontrolü (Mutlaka bir protokol olmalı, yoksa relative sayılır ve domaine eklenir)
    if (url && !url.startsWith('http')) {
        url = `https://${url}`;
    }

    // Sondaki slash işaretini temizle (endpoint'ler zaten / ile başlıyor)
    return url.replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();

// API hata sınıfı
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public type: string,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// API yanıt tipleri
interface ApiSuccessResponse<T> {
    statusCode: number;
    data: T;
}

interface ApiErrorResponse {
    statusCode: number;
    error: {
        type: string;
        description: string;
    };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

let isRefreshing = false;

// Ana fetch fonksiyonu
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Cookie'leri gönder
    });

    // 401 Aldığımızda (Access Token dolmuşsa)
    if (response.status === 401 && !isRetry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                // Refresh isteği at
                const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                });

                if (refreshRes.ok) {
                    isRefreshing = false;
                    // Orijinal isteği tekrar dene
                    return apiFetch<T>(endpoint, options, true);
                }
            } catch (err) {
                console.error('Refresh token error:', err);
            }
            isRefreshing = false;
        } else {
            // Eğer zaten refresh işlemi yapılıyorsa biraz bekle ve tekrar dene
            await new Promise(resolve => setTimeout(resolve, 1000));
            return apiFetch<T>(endpoint, options, true);
        }
    }

    const json: ApiResponse<T> = await response.json();

    if (!response.ok) {
        const errorBody = json as ApiErrorResponse;
        throw new ApiError(
            errorBody.statusCode || response.status,
            errorBody.error?.type || 'UNKNOWN',
            errorBody.error?.description || 'Bilinmeyen bir hata oluştu',
        );
    }

    const successJson = json as unknown as { data: T; meta?: Record<string, unknown> };
    if (successJson.meta) {
        return {
            items: successJson.data,
            meta: successJson.meta
        } as unknown as T;
    }

    return (json as ApiSuccessResponse<T>).data;
}

// HTTP metodları
export const api = {
    get: <T>(endpoint: string) => apiFetch<T>(endpoint),

    post: <T>(endpoint: string, body: Record<string, unknown> | unknown[]) =>
        apiFetch<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    put: <T>(endpoint: string, body: Record<string, unknown> | unknown[]) =>
        apiFetch<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    delete: <T>(endpoint: string) =>
        apiFetch<T>(endpoint, { method: 'DELETE' }),
};
