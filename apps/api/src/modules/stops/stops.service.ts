import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { Prisma } from '@prisma/client';

export class StopsService {
    static async findAll(page: number = 1, limit: number = 10, search?: string) {
        const skip = (page - 1) * limit;
        const where = search
            ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
            : {};

        const [stops, total] = await Promise.all([
            prisma.stop.findMany({
                skip,
                take: limit,
                where,
                orderBy: { name: 'asc' },
                include: {
                    routes: {
                        include: {
                            route: true
                        }
                    }
                }
            }),
            prisma.stop.count({ where }),
        ]);

        return { stops, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    static async findById(id: number) {
        const stop = await prisma.stop.findUnique({ where: { id } });
        if (!stop) throw ApiError.notFound('Durak bulunamadı');
        return stop;
    }

    static async create(data: { name: string; lat: number; lng: number; description?: string }) {
        return prisma.stop.create({ data });
    }

    static async update(id: number, data: { name?: string; lat?: number; lng?: number; description?: string }) {
        await this.findById(id);
        return prisma.stop.update({ where: { id }, data });
    }

    static async delete(id: number) {
        await this.findById(id);
        // bağlı routeStop kontrolü
        const routeStopCount = await prisma.routeStop.count({ where: { stopId: id } });
        if (routeStopCount > 0) {
            throw ApiError.conflict('Bu durağa bağlı güzergahlar var, önce onları silin');
        }
        await prisma.stop.delete({ where: { id } });
        return { success: true };
    }
}
