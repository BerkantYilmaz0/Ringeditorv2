import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';

export class RingTypesService {
    // tüm ring tiplerini getir (soft delete filtrelemeli)
    static async findAll() {
        const ringTypes = await prisma.ringType.findMany({
            where: { isDeleted: false },
            orderBy: { name: 'asc' },
        });
        return ringTypes;
    }

    // id'ye göre tek bir ring tipi getir
    static async findById(id: number) {
        const ringType = await prisma.ringType.findUnique({ where: { id } });
        if (!ringType || ringType.isDeleted) {
            throw ApiError.notFound('Ring tipi bulunamadı');
        }
        return ringType;
    }

    // yeni ring tipi oluştur
    static async create(data: { name: string; typeId: number; color?: string }) {
        return prisma.ringType.create({
            data: {
                name: data.name,
                typeId: data.typeId,
                color: data.color || '#000000',
            },
        });
    }

    // ring tipini güncelle
    static async update(id: number, data: { name?: string; typeId?: number; color?: string }) {
        await this.findById(id);
        return prisma.ringType.update({ where: { id }, data });
    }

    // soft delete
    static async delete(id: number) {
        await this.findById(id);

        // bağlı route kontrolü
        const routeCount = await prisma.route.count({ where: { ringTypeId: id } });
        if (routeCount > 0) {
            throw ApiError.conflict('Bu ring tipine bağlı güzergahlar var, önce onları silin');
        }

        await prisma.ringType.update({ where: { id }, data: { isDeleted: true } });
        return { success: true };
    }
}
