import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

export const authorize = (...roles: string[]) =>
    (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) return next(ApiError.unauthorized('Kimlik doğrulaması gerekli'));
        if (!roles.includes(req.user.role)) {
            return next(ApiError.forbidden('Bu işlem için yetkiniz yok'));
        }
        next();
    };
