import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';

export class JobsService {
    // seferleri tarih filtresine göre getir
    static async findAll(page: number = 1, limit: number = 10, filters?: { vehicleId?: string; routeId?: number; date?: string }) {
        const skip = (page - 1) * limit;
        const where: Prisma.JobWhereInput = {};

        if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
        if (filters?.routeId) where.routeId = filters.routeId;

        // tarih bazlı filtre — dueTime BigInt unix timestamp
        if (filters?.date) {
            const dayStart = new Date(filters.date).setHours(0, 0, 0, 0);
            const dayEnd = new Date(filters.date).setHours(23, 59, 59, 999);
            where.dueTime = { gte: BigInt(dayStart), lte: BigInt(dayEnd) };
        }

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                skip,
                take: limit,
                where,
                include: { vehicle: true, route: { include: { ringType: true } } },
                orderBy: { dueTime: 'asc' },
            }),
            prisma.job.count({ where }),
        ]);

        return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    static async findById(id: number) {
        const job = await prisma.job.findUnique({
            where: { id },
            include: { vehicle: true, route: { include: { ringType: true, stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } } } },
        });
        if (!job) throw ApiError.notFound('Sefer bulunamadı');
        return job;
    }

    static async create(data: { vehicleId: string; routeId?: number; dueTime: number; status?: number; type?: number }) {
        // çakışma kontrolü
        const conflict = await prisma.job.findUnique({
            where: { vehicleId_dueTime: { vehicleId: data.vehicleId, dueTime: BigInt(data.dueTime) } },
        });
        if (conflict) throw ApiError.conflict('Bu araç için belirtilen zamanda zaten bir sefer mevcut');

        return prisma.job.create({
            data: {
                vehicleId: data.vehicleId,
                routeId: data.routeId,
                dueTime: BigInt(data.dueTime),
                status: data.status || 1,
                type: data.type || 1,
            },
            include: { vehicle: true, route: true },
        });
    }

    static async update(id: number, data: { vehicleId?: string; routeId?: number; dueTime?: number; status?: number; type?: number }) {
        await this.findById(id);

        const updateData: Prisma.JobUpdateInput = {};
        if (data.vehicleId !== undefined) updateData.vehicle = { connect: { id: data.vehicleId } };
        if (data.routeId !== undefined) updateData.route = { connect: { id: data.routeId } };
        if (data.dueTime !== undefined) updateData.dueTime = BigInt(data.dueTime);
        if (data.status !== undefined) updateData.status = data.status;
        if (data.type !== undefined) updateData.type = data.type;

        return prisma.job.update({ where: { id }, data: updateData, include: { vehicle: true, route: true } });
    }

    static async delete(id: number) {
        await this.findById(id);
        await prisma.job.delete({ where: { id } });
        return { success: true };
    }

    static async bulkDelete(ids: number[]) {
        if (!ids || ids.length === 0) return { success: true, count: 0 };
        const result = await prisma.job.deleteMany({ where: { id: { in: ids } } });
        return { success: true, count: result.count };
    }

    // çakışma kontrolü (toplu)
    static async checkConflicts(items: { vehicleId: string; dueTime: number }[]) {
        const conflicts: { vehicleId: string; dueTime: number; existingJobId: number }[] = [];

        for (const item of items) {
            const existing = await prisma.job.findUnique({
                where: { vehicleId_dueTime: { vehicleId: item.vehicleId, dueTime: BigInt(item.dueTime) } },
            });
            if (existing) {
                conflicts.push({ vehicleId: item.vehicleId, dueTime: item.dueTime, existingJobId: existing.id });
            }
        }

        return { hasConflicts: conflicts.length > 0, conflicts };
    }

    // şablondan sefer üretme
    static async generateFromTemplate(data: { templateId: number; startDate: string; endDate: string }) {
        const template = await prisma.template.findUnique({
            where: { id: data.templateId, isDeleted: false },
            include: { jobs: { where: { isDeleted: false } } },
        });

        if (!template) throw ApiError.notFound('Şablon bulunamadı');

        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const createdJobs: Prisma.PrismaPromise<Prisma.JobGetPayload<Record<string, never>>>[] = [];

        // her gün için döngü
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDay = new Date(d);

            for (const tJob of template.jobs) {
                // vehicleId yoksa seferi atla
                if (!tJob.vehicleId) continue;

                // şablon seferinin saat ve dakikasını al
                const tTime = new Date(Number(tJob.dueTime));
                const hours = tTime.getUTCHours();
                const minutes = tTime.getUTCMinutes();

                // o günün tarihine saati set et
                const jobTime = new Date(currentDay);
                jobTime.setUTCHours(hours, minutes, 0, 0);
                const timestamp = jobTime.getTime();

                // araç çakışma kontrolü
                const conflict = await prisma.job.findUnique({
                    where: { vehicleId_dueTime: { vehicleId: tJob.vehicleId, dueTime: BigInt(timestamp) } },
                });
                if (conflict) continue;

                createdJobs.push(
                    prisma.job.create({
                        data: {
                            dueTime: BigInt(timestamp),
                            status: 1,
                            type: 1,
                            vehicleId: tJob.vehicleId,
                            routeId: tJob.routeId,
                        },
                    })
                );
            }
        }

        if (createdJobs.length > 0) {
            await prisma.$transaction(createdJobs);
        }

        return { success: true, count: createdJobs.length };
    }

    // takvim için istatistikleri getir (günlük sefer sayısı)
    static async getCalendarStats(month: string) {
        // month: "2024-02" formatında gelmeli
        const monthStart = new Date(month + '-01');
        const nextMonth = new Date(monthStart);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const startTs = monthStart.setHours(0, 0, 0, 0);
        const endTs = new Date(nextMonth.getTime() - 1).getTime();

        const jobs = await prisma.job.findMany({
            where: {
                dueTime: { gte: BigInt(startTs), lte: BigInt(endTs) },
            },
            select: { dueTime: true }
        });

        const stats: Record<string, number> = {};
        jobs.forEach(job => {
            const dateStr = format(new Date(Number(job.dueTime)), 'yyyy-MM-dd');
            stats[dateStr] = (stats[dateStr] || 0) + 1;
        });

        return stats;
    }
}
