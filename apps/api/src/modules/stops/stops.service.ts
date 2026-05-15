import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { Prisma } from '@prisma/client';
import { pageSkip } from '../../utils/paginate';

export class StopsService {
    static async findAll(page: number = 1, limit: number = 10, search?: string) {
        const skip = pageSkip(page, limit);
        const where: Prisma.StopWhereInput = { isDeleted: false };
        if (search) where.name = { contains: search, mode: Prisma.QueryMode.insensitive };

        const [stops, total] = await Promise.all([
            prisma.stop.findMany({
                skip,
                take: limit,
                where,
                orderBy: { name: 'asc' },
            }),
            prisma.stop.count({ where }),
        ]);

        return { stops, total };
    }

    static async findById(id: number) {
        const stop = await prisma.stop.findUnique({ where: { id } });
        if (!stop || stop.isDeleted) throw ApiError.notFound('Durak bulunamadı');
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
        const routeStopCount = await prisma.routeStop.count({ where: { stopId: id } });
        if (routeStopCount > 0) {
            throw ApiError.conflict('Bu durağa bağlı güzergahlar var, önce onları silin');
        }
        await prisma.stop.update({ where: { id }, data: { isDeleted: true } });
        return { success: true };
    }
}
