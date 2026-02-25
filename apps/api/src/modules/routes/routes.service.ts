import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { Prisma } from '@prisma/client';

export class RoutesService {
    static async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const [routes, total] = await Promise.all([
            prisma.route.findMany({
                skip,
                take: limit,
                include: { ringType: true, stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.route.count(),
        ]);
        return { routes, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    static async findById(id: number) {
        const route = await prisma.route.findUnique({
            where: { id },
            include: { ringType: true, stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
        });
        if (!route) throw ApiError.notFound('Güzergah bulunamadı');
        return route;
    }

    static async create(data: { name: string; ringTypeId: number; color?: string; description?: string; geometry?: Prisma.InputJsonValue; stops?: { stopId: number; sequence: number }[] }) {
        // ringType varlık kontrolü
        const ringType = await prisma.ringType.findUnique({ where: { id: data.ringTypeId } });
        if (!ringType) throw ApiError.notFound('Ring tipi bulunamadı');

        return prisma.route.create({
            data: {
                name: data.name,
                ringTypeId: data.ringTypeId,
                color: data.color,
                description: data.description,
                geometry: data.geometry,
                stops: data.stops?.length ? {
                    create: data.stops.map(s => ({
                        stop: { connect: { id: s.stopId } },
                        sequence: s.sequence,
                    })),
                } : undefined,
            },
            include: { ringType: true, stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
        });
    }

    static async update(id: number, data: { name?: string; ringTypeId?: number; color?: string; description?: string; geometry?: Prisma.InputJsonValue; stops?: { stopId: number; sequence: number }[] }) {
        await this.findById(id);

        if (data.ringTypeId) {
            const ringType = await prisma.ringType.findUnique({ where: { id: data.ringTypeId } });
            if (!ringType) throw ApiError.notFound('Ring tipi bulunamadı');
        }

        return prisma.route.update({
            where: { id },
            data: {
                name: data.name,
                ringTypeId: data.ringTypeId,
                color: data.color,
                description: data.description,
                geometry: data.geometry,
                stops: data.stops !== undefined ? {
                    deleteMany: {}, // Mevcutları sil
                    create: data.stops.map(s => ({
                        stop: { connect: { id: s.stopId } },
                        sequence: s.sequence,
                    })),
                } : undefined,
            },
            include: { ringType: true, stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
        });
    }

    static async delete(id: number) {
        await this.findById(id);
        // bağlı job kontrolü
        const jobCount = await prisma.job.count({ where: { routeId: id } });
        if (jobCount > 0) {
            throw ApiError.conflict('Bu güzergaha bağlı seferler var');
        }
        await prisma.route.delete({ where: { id } });
        return { success: true };
    }
}
