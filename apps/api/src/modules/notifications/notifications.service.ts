import { prisma } from '../../config/database';
import { subMinutes, addDays } from 'date-fns';

export interface Notification {
    id: string;
    type: 'overdue_job' | 'maintenance_due' | 'license_expiry';
    severity: 'error' | 'warning';
    title: string;
    message: string;
    entityId: string;
    entityType: 'job' | 'vehicle' | 'driver';
    createdAt: string;
}

export class NotificationsService {
    static async getAll(): Promise<Notification[]> {
        const now = new Date();
        const notifications: Notification[] = [];

        // Geciken seferler (PENDING + 15 dk geçmiş)
        const overdueJobs = await prisma.job.findMany({
            where: {
                status: 'PENDING',
                dueTime: { lte: subMinutes(now, 15) },
            },
            include: {
                vehicle: { select: { plate: true } },
                route: { select: { name: true } },
            },
            take: 20,
            orderBy: { dueTime: 'asc' },
        });

        for (const job of overdueJobs) {
            const minutesLate = Math.round((now.getTime() - new Date(job.dueTime).getTime()) / 60000);
            notifications.push({
                id: `overdue-${job.id}`,
                type: 'overdue_job',
                severity: 'error',
                title: 'Geciken Sefer',
                message: `${job.vehicle?.plate ?? 'Araç yok'} — ${job.route?.name ?? 'Hat yok'} ${minutesLate} dk gecikti`,
                entityId: String(job.id),
                entityType: 'job',
                createdAt: job.dueTime.toISOString(),
            });
        }

        // Bakım tarihi yaklaşan araçlar (7 gün içinde)
        const maintenanceDue = await prisma.vehicle.findMany({
            where: {
                isActive: true,
                nextServiceDate: {
                    not: null,
                    lte: addDays(now, 7),
                    gte: now,
                },
            },
            select: { id: true, plate: true, nextServiceDate: true },
        });

        for (const v of maintenanceDue) {
            const daysLeft = Math.ceil((new Date(v.nextServiceDate!).getTime() - now.getTime()) / 86400000);
            notifications.push({
                id: `maint-${v.id}`,
                type: 'maintenance_due',
                severity: 'warning',
                title: 'Bakım Tarihi Yaklaşıyor',
                message: `${v.plate} aracının bakım tarihi ${daysLeft} gün sonra`,
                entityId: v.id,
                entityType: 'vehicle',
                createdAt: now.toISOString(),
            });
        }

        // Ehliyet bitiş tarihi yaklaşan sürücüler (30 gün içinde)
        const licenseExpiring = await prisma.driver.findMany({
            where: {
                isActive: true,
                licenseExpiry: {
                    not: null,
                    lte: addDays(now, 30),
                    gte: now,
                },
            },
            select: { id: true, name: true, licenseExpiry: true },
        });

        for (const d of licenseExpiring) {
            const daysLeft = Math.ceil((new Date(d.licenseExpiry!).getTime() - now.getTime()) / 86400000);
            notifications.push({
                id: `license-${d.id}`,
                type: 'license_expiry',
                severity: 'warning',
                title: 'Ehliyet Bitiş Tarihi Yaklaşıyor',
                message: `${d.name} sürücüsünün ehliyeti ${daysLeft} gün sonra bitiyor`,
                entityId: d.id,
                entityType: 'driver',
                createdAt: now.toISOString(),
            });
        }

        return notifications.sort((a, b) => {
            if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }
}
