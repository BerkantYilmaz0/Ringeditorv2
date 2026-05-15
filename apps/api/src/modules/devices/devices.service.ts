import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { DeviceCreateInput, DeviceUpdateInput } from '@ring-planner/shared';
import { pageSkip } from '../../utils/paginate';

export class DevicesService {
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

        return { vehicles, total };
    }

    static async findById(id: string) {
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) throw ApiError.notFound('Araç bulunamadı');
        return vehicle;
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
        const { plate, brand, model, year, color, trackerId, simNumber, description, driverId, isActive } = data;
        return prisma.vehicle.update({
            where: { id },
            data: { plate, brand, model, year, color, trackerId, simNumber, description, driverId, isActive },
        });
    }

    static async delete(id: string) {
        await this.findById(id);
        await prisma.vehicle.delete({ where: { id } });
        return { success: true };
    }
}
