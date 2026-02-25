import { prisma } from '../../config/database';

export class DashboardService {
    static async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayStart = BigInt(today.getTime());
        const todayEnd = BigInt(tomorrow.getTime());

        const [
            todayJobCount,
            totalRoutes,
            totalVehicles,
            activeVehicles,
            upcomingJobs,
        ] = await Promise.all([
            // bugünkü sefer sayısı
            prisma.job.count({
                where: { dueTime: { gte: todayStart, lt: todayEnd } },
            }),
            // toplam aktif güzergah
            prisma.route.count(),
            // toplam araç
            prisma.vehicle.count(),
            // aktif araç
            prisma.vehicle.count({ where: { isActive: true } }),
            // yaklaşan seferler (bugünden itibaren en yakın 10)
            prisma.job.findMany({
                where: { dueTime: { gte: todayStart } },
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
