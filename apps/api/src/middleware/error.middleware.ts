import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = 500;
    let type = 'SERVER_ERROR';
    let message = 'Beklenmeyen bir hata oluştu';
    let details = undefined;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        type = err.type;
        message = err.message;
        details = err.details;
    } else {
        logger.error('Unhandled Error:', err);
        if (env.NODE_ENV === 'development') {
            message = err.message;
        }
    }

    // 500 hataları ve kritik durumlar için log bas
    if (statusCode >= 500) {
        logger.error(`[${req.method}] ${req.url} - ${message}`, {
            stack: err.stack,
            ip: req.ip,
        });
    } else {
        // 400 lü hatalar info veya warn seviyesi (isteğe bağlı)
        logger.warn(`[${req.method}] ${req.url} - ${type}: ${message}`);
    }

    res.status(statusCode).json({
        statusCode,
        error: {
            type,
            description: message,
            details,
        },
    });
};
