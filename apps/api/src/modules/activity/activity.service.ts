import { prisma } from '../../config/database';
import { parseISO } from 'date-fns';

export class ActivityService {
    static async findAll(page = 1, limit = 50, userId?: string, entity?: string, from?: string, to?: string) {
        const where: any = {};
        if (userId) where.userId = userId;
        if (entity) where.entity = entity;
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = parseISO(from);
            if (to) where.createdAt.lte = parseISO(to);
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { id: true, username: true, role: true } },
                },
            }),
            prisma.activityLog.count({ where }),
        ]);

        return { logs, total, page, limit };
    }

    static async clearAll() {
        await prisma.activityLog.deleteMany({});
        return { success: true };
    }

    static async delete(id: number) {
        await prisma.activityLog.delete({ where: { id } });
        return { success: true };
    }
}
