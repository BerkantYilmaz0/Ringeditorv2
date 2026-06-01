import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const METHOD_ACTION: Record<string, string> = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
};

function parseEntity(path: string): { entity: string; entityId?: string } {
    // /api/v1/jobs/123 → entity=job, entityId=123
    const segments = path.replace(/^\/api\/v1\//, '').split('/').filter(Boolean);
    const entityMap: Record<string, string> = {
        jobs: 'job', routes: 'route', devices: 'vehicle', drivers: 'driver',
        users: 'user', templates: 'template', stops: 'stop', 'ring-types': 'ring_type',
    };
    const seg0 = segments[0] ?? '';
    const seg1 = segments[1];
    const entity = entityMap[seg0] ?? seg0 ?? 'unknown';
    const entityId = seg1 && /^\d+$|^[a-z0-9]{24,}$/i.test(seg1) ? seg1 : undefined;
    return { entity, entityId };
}

export const activityLogger = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'OPTIONS') return next();

    const originalJson = res.json.bind(res);
    res.json = (body) => {
        // Sadece başarılı ve kimliği doğrulanmış kullanıcı yanıtlarında log at
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
            const action = `${METHOD_ACTION[req.method] ?? req.method}_${parseEntity(req.path).entity.toUpperCase()}`;
            const { entity, entityId } = parseEntity(req.path);
            const targetName = body?.data?.fullName ?? 
                (body?.data?.name ?? 
                (body?.data?.plateNumber ?? 
                (body?.data?.username ?? 
                (body?.fullName ?? 
                (body?.name ?? 
                (body?.plateNumber ?? 
                (body?.username ?? 
                (req.body?.fullName ?? 
                (req.body?.name ?? 
                (req.body?.plateNumber ?? 
                (req.body?.username ?? undefined)))))))))));

            prisma.activityLog.create({
                data: {
                    userId: req.user.id,
                    action,
                    entity,
                    entityId: entityId ?? (body?.data?.id?.toString() ?? body?.id?.toString()),
                    meta: { 
                        method: req.method, 
                        path: req.path, 
                        status: res.statusCode,
                        targetName: targetName ? String(targetName) : undefined
                    },
                },
            }).catch(err => logger.error('ActivityLog write error:', err));
        }
        return originalJson(body);
    };
    next();
};
