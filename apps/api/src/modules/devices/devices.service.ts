import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { VehicleCreateInput, VehicleUpdateInput } from '@ring-planner/shared';

export class DevicesService {
    // tüm araçları sayfalı ve aramalı getir
    static async findAll(page: number = 1, limit: number = 10, search?: string) {
        const skip = (page - 1) * limit;

        const whereClause = search ? {
            plate: { contains: search, mode: 'insensitive' as const }
        } : {};

        const [vehicles, total] = await Promise.all([
            prisma.vehicle.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { plate: 'asc' },
                include: { driver: true }
            }),
            prisma.vehicle.count({ where: whereClause }),
        ]);

        return { vehicles, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // id'ye göre tek araç getir
    static async findById(id: string) {
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) throw ApiError.notFound('Araç bulunamadı');
        return vehicle;
    }

    // yeni araç oluştur
    static async create(data: VehicleCreateInput) {
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

    // araç güncelle
    static async update(id: string, data: VehicleUpdateInput) {
        await this.findById(id);

        if (data.plate) {
            const existingPlate = await prisma.vehicle.findFirst({
                where: { plate: data.plate, NOT: { id } },
            });
            if (existingPlate) throw ApiError.conflict('Belirtilen plaka başka bir araç tarafından kullanılıyor');
        }

        return prisma.vehicle.update({ where: { id }, data });
    }

    // araç sil
    static async delete(id: string) {
        await this.findById(id);
        await prisma.vehicle.delete({ where: { id } });
        return { success: true };
    }
}
