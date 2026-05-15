import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';

export class RouteStopsService {
    // belirli bir güzergahın duraklarını sıralı getir
    static async findByRouteId(routeId: number) {
        const stops = await prisma.routeStop.findMany({
            where: { routeId },
            include: { stop: true },
            orderBy: { sequence: 'asc' },
        });
        return stops;
    }

    // güzergaha durak ekle
    static async addStop(routeId: number, stopId: number, sequence: number) {
        // route ve stop varlığını paralel kontrol et
        const [route, stop] = await Promise.all([
            prisma.route.findUnique({ where: { id: routeId } }),
            prisma.stop.findUnique({ where: { id: stopId } }),
        ]);
        if (!route) throw ApiError.notFound('Güzergah bulunamadı');
        if (!stop) throw ApiError.notFound('Durak bulunamadı');

        try {
            return await prisma.routeStop.create({
                data: { routeId, stopId, sequence },
                include: { stop: true },
            });
        } catch (err: unknown) {
            // Prisma unique constraint ihlali — durak zaten ekli
            if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
                throw ApiError.conflict('Bu durak zaten güzergaha ekli');
            }
            throw err;
        }
    }

    // güzergahtan durak kaldır
    static async removeStop(routeId: number, stopId: number) {
        const existing = await prisma.routeStop.findUnique({
            where: { routeId_stopId: { routeId, stopId } },
        });
        if (!existing) throw ApiError.notFound('Güzergahta bu durak bulunamadı');

        await prisma.routeStop.delete({
            where: { routeId_stopId: { routeId, stopId } },
        });
        return { success: true };
    }

    // güzergahtaki durakları yeniden sırala
    static async reorder(routeId: number, items: { stopId: number; sequence: number }[]) {
        await Promise.all(
            items.map((item) =>
                prisma.routeStop.update({
                    where: { routeId_stopId: { routeId, stopId: item.stopId } },
                    data: { sequence: item.sequence },
                })
            )
        );
        return this.findByRouteId(routeId);
    }
}
