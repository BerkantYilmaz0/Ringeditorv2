import { prisma } from '../../config/database';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';

function getPeriodDates(period: string, from?: string, to?: string) {
    const now = new Date();
    if (period === 'week') {
        return { start: subDays(now, 7), end: now };
    } else if (period === 'month') {
        return { start: subDays(now, 30), end: now };
    } else if (period === '3months') {
        return { start: subDays(now, 90), end: now };
    } else if (from && to) {
        return { start: parseISO(from), end: parseISO(to) };
    }
    return { start: subDays(now, 30), end: now };
}

export class ReportsService {
    static async getSummary(period: string, from?: string, to?: string) {
        const { start, end } = getPeriodDates(period, from, to);
        const where = { dueTime: { gte: start, lte: end } };

        const [total, completed, cancelled, inProgress, pending] = await Promise.all([
            prisma.job.count({ where }),
            prisma.job.count({ where: { ...where, status: 'COMPLETED' } }),
            prisma.job.count({ where: { ...where, status: 'CANCELLED' } }),
            prisma.job.count({ where: { ...where, status: 'IN_PROGRESS' } }),
            prisma.job.count({ where: { ...where, status: 'PENDING' } }),
        ]);

        // Doluluk ortalaması
        const occupancyData = await prisma.job.aggregate({
            where: { ...where, passengerCount: { not: null } },
            _avg: { passengerCount: true },
        });

        // Aktif araç sayısı
        const activeVehicles = await prisma.vehicle.count({ where: { isActive: true } });
        const activeDrivers = await prisma.driver.count({ where: { isActive: true } });

        return {
            totalJobs: total,
            completedJobs: completed,
            cancelledJobs: cancelled,
            inProgressJobs: inProgress,
            pendingJobs: pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
            avgOccupancy: Math.round(occupancyData._avg.passengerCount ?? 0),
            activeVehicles,
            activeDrivers,
            period: { start: start.toISOString(), end: end.toISOString() },
        };
    }

    static async getTimeline(period: string, from?: string, to?: string) {
        const { start, end } = getPeriodDates(period, from, to);
        const days = eachDayOfInterval({ start, end });

        const result = await Promise.all(
            days.map(async (day) => {
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);
                const where = { dueTime: { gte: dayStart, lte: dayEnd } };
                const [total, completed, cancelled] = await Promise.all([
                    prisma.job.count({ where }),
                    prisma.job.count({ where: { ...where, status: 'COMPLETED' } }),
                    prisma.job.count({ where: { ...where, status: 'CANCELLED' } }),
                ]);
                return {
                    date: format(day, 'yyyy-MM-dd'),
                    total,
                    completed,
                    cancelled,
                    pending: total - completed - cancelled,
                };
            })
        );
        return result;
    }

    static async getVehicleStats(period: string, from?: string, to?: string) {
        const { start, end } = getPeriodDates(period, from, to);
        const where = { dueTime: { gte: start, lte: end } };

        const vehicles = await prisma.vehicle.findMany({
            where: { isActive: true },
            select: { id: true, plate: true, brand: true, model: true, capacity: true,
                driver: { select: { name: true } } },
        });

        const stats = await Promise.all(
            vehicles.map(async (v) => {
                const vWhere = { ...where, vehicleId: v.id };
                const [total, completed, occupancyAgg] = await Promise.all([
                    prisma.job.count({ where: vWhere }),
                    prisma.job.count({ where: { ...vWhere, status: 'COMPLETED' } }),
                    prisma.job.aggregate({ where: { ...vWhere, passengerCount: { not: null } }, _avg: { passengerCount: true } }),
                ]);
                return {
                    ...v,
                    jobCount: total,
                    completedCount: completed,
                    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                    avgOccupancy: Math.round(occupancyAgg._avg.passengerCount ?? 0),
                };
            })
        );
        return stats.sort((a, b) => b.jobCount - a.jobCount);
    }

    static async getRouteStats(period: string, from?: string, to?: string) {
        const { start, end } = getPeriodDates(period, from, to);
        const where = { dueTime: { gte: start, lte: end }, routeId: { not: null } };

        const routes = await prisma.route.findMany({
            where: { isDeleted: false },
            select: { id: true, name: true, color: true, ringType: { select: { name: true, color: true } } },
        });

        const stats = await Promise.all(
            routes.map(async (r) => {
                const rWhere = { ...where, routeId: r.id };
                const jobs = await prisma.job.findMany({
                    where: rWhere,
                    select: { dueTime: true, status: true },
                });
                const hourCounts: Record<number, number> = {};
                jobs.forEach(j => {
                    const h = new Date(j.dueTime).getHours();
                    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
                });
                const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
                return {
                    ...r,
                    jobCount: jobs.length,
                    completedCount: jobs.filter(j => j.status === 'COMPLETED').length,
                    peakHour: peakHour ? `${peakHour.padStart(2, '0')}:00` : null,
                };
            })
        );
        return stats.filter(r => r.jobCount > 0).sort((a, b) => b.jobCount - a.jobCount);
    }

    static async getDriverStats(period: string, from?: string, to?: string) {
        const { start, end } = getPeriodDates(period, from, to);

        const drivers = await prisma.driver.findMany({
            where: { isActive: true },
            include: { vehicles: { select: { id: true, plate: true } } },
        });

        const stats = await Promise.all(
            drivers.map(async (d) => {
                const vehicleIds = d.vehicles.map(v => v.id);
                if (vehicleIds.length === 0) return { ...d, jobCount: 0, completedCount: 0, activeDays: 0 };

                const where = { vehicleId: { in: vehicleIds }, dueTime: { gte: start, lte: end } };
                const [total, completed, jobs] = await Promise.all([
                    prisma.job.count({ where }),
                    prisma.job.count({ where: { ...where, status: 'COMPLETED' } }),
                    prisma.job.findMany({ where, select: { dueTime: true } }),
                ]);
                const uniqueDays = new Set(jobs.map(j => format(new Date(j.dueTime), 'yyyy-MM-dd'))).size;

                return { ...d, jobCount: total, completedCount: completed, activeDays: uniqueDays };
            })
        );
        return stats.sort((a, b) => b.jobCount - a.jobCount);
    }
}
