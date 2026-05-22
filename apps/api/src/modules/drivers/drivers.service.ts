import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';

export interface DriverCreateInput {
    name: string;
    phone?: string;
    licenseType?: string;
    licenseExpiry?: string;
    address?: string;
    notes?: string;
}

export class DriversService {
    static async findAll(page = 1, limit = 50, search?: string, includeInactive = false) {
        const where = {
            ...(includeInactive ? {} : { isActive: true }),
            ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
        };
        const [drivers, total] = await Promise.all([
            prisma.driver.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    vehicles: {
                        where: { isActive: true },
                        select: { id: true, plate: true, brand: true, model: true },
                    },
                },
            }),
            prisma.driver.count({ where }),
        ]);

        const now = new Date();
        const enriched = await Promise.all(
            drivers.map(async (d) => {
                const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); weekStart.setHours(0,0,0,0);

                const vehicleIds = d.vehicles.map(v => v.id);
                const [todayCount, weekCount, totalCount] = vehicleIds.length > 0 ? await Promise.all([
                    prisma.job.count({ where: { vehicleId: { in: vehicleIds }, dueTime: { gte: todayStart, lte: todayEnd } } }),
                    prisma.job.count({ where: { vehicleId: { in: vehicleIds }, dueTime: { gte: weekStart } } }),
                    prisma.job.count({ where: { vehicleId: { in: vehicleIds } } }),
                ]) : [0, 0, 0];

                const licenseExpiry = d.licenseExpiry;
                const daysToExpiry = licenseExpiry
                    ? Math.ceil((new Date(licenseExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                return { ...d, todayJobCount: todayCount, weekJobCount: weekCount, totalJobCount: totalCount, daysToExpiry };
            })
        );

        return { drivers: enriched, total, page, limit };
    }

    static async findById(id: string) {
        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                vehicles: {
                    select: { id: true, plate: true, brand: true, model: true, isActive: true },
                },
            },
        });
        if (!driver) throw ApiError.notFound('Sürücü bulunamadı');

        const vehicleIds = driver.vehicles.map(v => v.id);
        const recentJobs = vehicleIds.length > 0 ? await prisma.job.findMany({
            where: { vehicleId: { in: vehicleIds } },
            orderBy: { dueTime: 'desc' },
            take: 20,
            include: { route: { include: { ringType: true } }, vehicle: { select: { plate: true } } },
        }) : [];

        const totalJobCount = vehicleIds.length > 0 ? await prisma.job.count({ where: { vehicleId: { in: vehicleIds } } }) : 0;

        const now = new Date();
        const daysToExpiry = driver.licenseExpiry
            ? Math.ceil((new Date(driver.licenseExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return { ...driver, recentJobs, totalJobCount, daysToExpiry };
    }

    static async create(data: DriverCreateInput) {
        return prisma.driver.create({
            data: {
                name: data.name,
                phone: data.phone,
                licenseType: data.licenseType,
                licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
                address: data.address,
                notes: data.notes,
            },
        });
    }

    static async update(id: string, data: Partial<DriverCreateInput>) {
        await this.findById(id);
        return prisma.driver.update({
            where: { id },
            data: {
                ...data,
                licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
            },
        });
    }

    static async delete(id: string) {
        await this.findById(id);
        // Aracı olan sürücüyü direkt silme, pasife al
        await prisma.driver.update({ where: { id }, data: { isActive: false } });
        return { success: true };
    }
}
