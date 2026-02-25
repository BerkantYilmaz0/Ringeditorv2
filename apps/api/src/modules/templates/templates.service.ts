import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';

export class TemplatesService {
    static async findAll() {
        const templates = await prisma.template.findMany({
            where: { isDeleted: false },
            include: { _count: { select: { jobs: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return templates;
    }

    static async findById(id: number) {
        const template = await prisma.template.findUnique({
            where: { id },
            include: {
                jobs: {
                    where: { isDeleted: false },
                    include: { ringType: true, route: true, vehicle: true },
                    orderBy: { dueTime: 'asc' },
                },
            },
        });
        if (!template || template.isDeleted) throw ApiError.notFound('Şablon bulunamadı');
        return template;
    }

    static async create(data: { name: string; description?: string }) {
        return prisma.template.create({ data });
    }

    static async update(id: number, data: { name?: string; description?: string }) {
        await this.findById(id);
        return prisma.template.update({ where: { id }, data });
    }

    static async delete(id: number) {
        await this.findById(id);
        // soft delete ile birlikte alt seferleri de sil
        await prisma.template.update({
            where: { id },
            data: { isDeleted: true },
        });
        return { success: true };
    }
}
