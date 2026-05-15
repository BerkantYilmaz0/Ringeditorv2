import { prisma } from '../../config/database';

export class DashboardService {
    static async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            todayJobCount,
            totalRoutes,
            totalVehicles,
            activeVehicles,
            upcomingJobs,
        ] = await Promise.all([
            // bugünkü sefer sayısı
            prisma.job.count({
                where: { dueTime: { gte: today, lt: tomorrow } },
            }),
            // toplam aktif güzergah
            prisma.route.count({ where: { isDeleted: false } }),
            // toplam araç
            prisma.vehicle.count(),
            // aktif araç
            prisma.vehicle.count({ where: { isActive: true } }),
            // yaklaşan seferler (bugünden itibaren en yakın 10)
            prisma.job.findMany({
                where: { dueTime: { gte: today } },
                include: { vehicle: true, route: { include: { ringType: true } } },
                orderBy: { dueTime: 'asc' },
                take: 10,
            }),
        ]);

        return {
            todayJobCount,
            totalRoutes,
            totalVehicles,
            activeVehicles,
            upcomingJobs,
        };
    }
}
