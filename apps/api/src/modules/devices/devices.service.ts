import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { DeviceCreateInput, DeviceUpdateInput } from '@ring-planner/shared';
import { pageSkip } from '../../utils/paginate';

export class DevicesService {
    private static async enrichWithStats(vehicles: Awaited<ReturnType<typeof prisma.vehicle.findMany>>) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();

        const ids = vehicles.map(v => v.id);

        const [todayJobCounts, activeJobs] = await Promise.all([
            prisma.job.groupBy({
                by: ['vehicleId'],
                where: {
                    vehicleId: { in: ids },
                    dueTime: { gte: todayStart, lte: todayEnd },
                },
                _count: { id: true },
            }),
            prisma.job.findMany({
                where: {
                    vehicleId: { in: ids },
                    dueTime: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000), lte: new Date(now.getTime() + 30 * 60 * 1000) },
                    status: { in: ['PENDING', 'IN_PROGRESS'] },
                },
                select: { vehicleId: true },
            }),
        ]);

        const tripMap = Object.fromEntries(todayJobCounts.map(r => [r.vehicleId, r._count.id]));
        const activeSet = new Set(activeJobs.map(j => j.vehicleId));

        return vehicles.map(v => ({
            ...v,
            todayTripCount: tripMap[v.id] ?? 0,
            currentStatus: v.vehicleStatus === 'MAINTENANCE' ? 'Bakımda' : activeSet.has(v.id) ? 'Görevde' : 'Boşta',
        }));
    }

    static async findAll(page: number = 1, limit: number = 10, search?: string) {
        const skip = pageSkip(page, limit);
        const whereClause = search
            ? { plate: { contains: search, mode: 'insensitive' as const } }
            : {};

        const [vehicles, total] = await Promise.all([
            prisma.vehicle.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { plate: 'asc' },
                include: { driver: true },
            }),
            prisma.vehicle.count({ where: whereClause }),
        ]);

        const enriched = await this.enrichWithStats(vehicles);
        return { vehicles: enriched, total };
    }

    static async findById(id: string) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: { driver: true },
        });
        if (!vehicle) throw ApiError.notFound('Araç bulunamadı');
        const [enriched] = await this.enrichWithStats([vehicle]);
        return enriched;
    }

    static async create(data: DeviceCreateInput) {
        const existingPlate = await prisma.vehicle.findUnique({ where: { plate: data.plate } });
        if (existingPlate) throw ApiError.conflict('Bu plakaya sahip bir araç zaten mevcut');

        if (data.trackerId) {
            const existingTracker = await prisma.vehicle.findUnique({ where: { trackerId: data.trackerId } });
            if (existingTracker) throw ApiError.conflict('Bu tracker ID zaten kullanılıyor');
        }

        return prisma.vehicle.create({
            data: {
                plate: data.plate,
                brand: data.brand,
                model: data.model,
                year: data.year,
                color: data.color,
                trackerId: data.trackerId,
                simNumber: data.simNumber,
                description: data.description,
                driverId: data.driverId,
                isActive: data.isActive ?? true,
                vehicleStatus: data.vehicleStatus ?? 'AVAILABLE',
                capacity: data.capacity ?? null,
                lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : null,
                nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
            },
        });
    }

    static async update(id: string, data: DeviceUpdateInput) {
        await this.findById(id);

        if (data.plate) {
            const existingPlate = await prisma.vehicle.findFirst({
                where: { plate: data.plate, NOT: { id } },
            });
            if (existingPlate) throw ApiError.conflict('Belirtilen plaka başka bir araç tarafından kullanılıyor');
        }

        // Yalnızca izin verilen alanları Prisma'ya geçir
        const { plate, brand, model, year, color, trackerId, simNumber, description, driverId, isActive, vehicleStatus, capacity, lastServiceDate, nextServiceDate } = data;
        return prisma.vehicle.update({
            where: { id },
            data: {
                plate, brand, model, year, color, trackerId, simNumber, description, driverId, isActive,
                vehicleStatus: vehicleStatus ?? undefined,
                capacity: capacity ?? undefined,
                lastServiceDate: lastServiceDate !== undefined ? (lastServiceDate ? new Date(lastServiceDate) : null) : undefined,
                nextServiceDate: nextServiceDate !== undefined ? (nextServiceDate ? new Date(nextServiceDate) : null) : undefined,
            },
        });
    }

    static async delete(id: string) {
        await this.findById(id);
        await prisma.vehicle.delete({ where: { id } });
        return { success: true };
    }
}
