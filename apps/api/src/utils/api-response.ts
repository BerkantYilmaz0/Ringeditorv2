import { ApiResponse, PaginatedResponse, PaginationMeta } from '@ring-planner/shared';

export class ResponseFormatter {
    static success<T>(data: T, statusCode = 200): ApiResponse<T> {
        return {
            statusCode,
            data,
        };
    }

    static paginated<T>(data: T[], total: number, page: number, limit: number, statusCode = 200): PaginatedResponse<T> {
        const meta: PaginationMeta = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
        return {
            statusCode,
            data,
            meta,
        };
    }
}
