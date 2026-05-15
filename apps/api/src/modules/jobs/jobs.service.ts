import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { pageSkip } from '../../utils/paginate';

export class JobsService {
    static async findAll(page: number = 1, limit: number = 10, filters?: { vehicleId?: string; routeId?: number; date?: string }) {
        const skip = pageSkip(page, limit);
        const where: Prisma.JobWhereInput = {};

        if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
        if (filters?.routeId) where.routeId = filters.routeId;

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

        return { jobs, total };
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

    // Tek sorguda çakışma kontrolü (N+1 ortadan kalktı)
    static async checkConflicts(items: { vehicleId: string; dueTime: number }[]) {
        if (!items || items.length === 0) return { hasConflicts: false, conflicts: [] };

        const existing = await prisma.job.findMany({
            where: {
                OR: items.map(i => ({
                    vehicleId: i.vehicleId,
                    dueTime: BigInt(i.dueTime),
                })),
            },
            select: { id: true, vehicleId: true, dueTime: true },
        });

        const conflicts = existing.map(e => ({
            vehicleId: e.vehicleId,
            dueTime: Number(e.dueTime),
            existingJobId: e.id,
        }));

        return { hasConflicts: conflicts.length > 0, conflicts };
    }

    // Şablondan sefer üretme — tek toplu sorgu + createMany
    static async generateFromTemplate(data: { templateId: number; startDate: string; endDate: string }) {
        const template = await prisma.template.findUnique({
            where: { id: data.templateId, isDeleted: false },
            include: { jobs: { where: { isDeleted: false } } },
        });

        if (!template) throw ApiError.notFound('Şablon bulunamadı');

        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        const candidates: { vehicleId: string; routeId: number | null; dueTime: bigint }[] = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const tJob of template.jobs) {
                if (!tJob.vehicleId) continue;

                const tTime = new Date(Number(tJob.dueTime));
                const jobTime = new Date(d);
                jobTime.setUTCHours(tTime.getUTCHours(), tTime.getUTCMinutes(), 0, 0);

                candidates.push({
                    vehicleId: tJob.vehicleId,
                    routeId: tJob.routeId,
                    dueTime: BigInt(jobTime.getTime()),
                });
            }
        }

        if (candidates.length === 0) return { success: true, count: 0 };

        // Tüm çakışmaları tek sorguda bul
        const existingJobs = await prisma.job.findMany({
            where: { OR: candidates.map(c => ({ vehicleId: c.vehicleId, dueTime: c.dueTime })) },
            select: { vehicleId: true, dueTime: true },
        });

        const conflictSet = new Set(existingJobs.map(j => `${j.vehicleId}:${j.dueTime}`));
        const toCreate = candidates.filter(c => !conflictSet.has(`${c.vehicleId}:${c.dueTime}`));

        if (toCreate.length === 0) return { success: true, count: 0 };

        const result = await prisma.job.createMany({
            data: toCreate.map(c => ({
                vehicleId: c.vehicleId,
                routeId: c.routeId,
                dueTime: c.dueTime,
                status: 1,
                type: 1,
            })),
            skipDuplicates: true,
        });

        return { success: true, count: result.count };
    }

    static async getCalendarStats(month: string) {
        const monthStart = new Date(month + '-01');
        const nextMonth = new Date(monthStart);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const startTs = monthStart.setHours(0, 0, 0, 0);
        const endTs = new Date(nextMonth.getTime() - 1).getTime();

        const jobs = await prisma.job.findMany({
            where: { dueTime: { gte: BigInt(startTs), lte: BigInt(endTs) } },
            select: { dueTime: true },
        });

        const stats: Record<string, number> = {};
        jobs.forEach(job => {
            const dateStr = format(new Date(Number(job.dueTime)), 'yyyy-MM-dd');
            stats[dateStr] = (stats[dateStr] || 0) + 1;
        });

        return stats;
    }
}
