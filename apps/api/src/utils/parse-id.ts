import { ApiError } from './api-error';

// URL parametresinden güvenli sayı parse'ı
export function parseId(value: string | string[] | undefined): number {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) throw ApiError.badRequest('ID parametresi eksik');

    const id = parseInt(raw, 10);
    if (isNaN(id) || id <= 0) {
        throw ApiError.badRequest('Geçersiz ID parametresi');
    }
    return id;
}
