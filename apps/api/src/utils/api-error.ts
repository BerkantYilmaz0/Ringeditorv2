// validasyon hata detay tipi
interface ValidationDetail {
    field: string;
    message: string;
}

export class ApiError extends Error {
    statusCode: number;
    type: string;
    details?: ValidationDetail[];

    constructor(
        statusCode: number,
        type: string,
        message: string,
        details?: ValidationDetail[]
    ) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.type = type;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Geçersiz İstek', details?: ValidationDetail[]) {
        return new ApiError(400, 'VALIDATION_ERROR', message, details);
    }

    static unauthorized(message = 'Yetkisiz erişim') {
        return new ApiError(401, 'UNAUTHORIZED', message);
    }

    static forbidden(message = 'Bu işlem için yetkiniz yok') {
        return new ApiError(403, 'FORBIDDEN', message);
    }

    static notFound(message = 'Kayıt bulunamadı') {
        return new ApiError(404, 'NOT_FOUND', message);
    }

    static conflict(message = 'Çakışma tespit edildi') {
        return new ApiError(409, 'CONFLICT', message);
    }

    static tooManyRequests(message = 'Çok fazla istek gönderdiniz') {
        return new ApiError(429, 'TOO_MANY_REQUESTS', message);
    }

    static internal(message = 'Sunucu Hatası') {
        return new ApiError(500, 'SERVER_ERROR', message);
    }
}
