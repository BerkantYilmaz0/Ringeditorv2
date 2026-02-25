export type PaginationMeta = {
    /** Toplam kayıt sayısı */
    total: number;
    /** Mevcut sayfa */
    page: number;
    /** Sayfa başına kayıt sayısı */
    limit: number;
    /** Toplam sayfa sayısı */
    totalPages: number;
};
export type ApiResponse<T> = {
    statusCode: number;
    data: T;
};
export type PaginatedResponse<T> = {
    statusCode: number;
    data: T[];
    meta: PaginationMeta;
};
type ErrorDetail = {
    field: string;
    message: string;
};
export type ErrorResponse = {
    statusCode: number;
    error: {
        type: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 'TOO_MANY_REQUESTS' | 'IP_BLOCKED' | 'PAYLOAD_TOO_LARGE' | 'SERVER_ERROR';
        description: string;
        details?: ErrorDetail[];
    };
};
export {};
//# sourceMappingURL=common.d.ts.map