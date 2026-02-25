import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';

export class TemplateJobsService {
    // şablona ait seferleri getir
    static async findByTemplateId(templateId: number) {
        return prisma.templateJob.findMany({
            where: { templateId, isDeleted: false },
            include: { ringType: true, route: true, vehicle: true },
            orderBy: { dueTime: 'asc' },
        });
    }

    // toplu sefer ekleme
    static async bulkCreate(templateId: number, items: { dueTime: number; ringTypeId: number; routeId?: number; vehicleId?: string }[]) {
        const template = await prisma.template.findUnique({ where: { id: templateId } });
        if (!template || template.isDeleted) throw ApiError.notFound('Şablon bulunamadı');

        const created = await prisma.$transaction(
            items.map((item) =>
                prisma.templateJob.create({
                    data: {
                        templateId,
                        dueTime: BigInt(item.dueTime),
                        ringTypeId: item.ringTypeId,
                        routeId: item.routeId,
                        vehicleId: item.vehicleId,
                    },
                })
            )
        );
        return created;
    }

    // tekil güncelleme
    static async update(id: number, data: { dueTime?: number; ringTypeId?: number; routeId?: number; vehicleId?: string }) {
        const existing = await prisma.templateJob.findUnique({ where: { id } });
        if (!existing || existing.isDeleted) throw ApiError.notFound('Şablon seferi bulunamadı');

        const updatePayload: Record<string, unknown> = {};
        if (data.dueTime !== undefined) updatePayload.dueTime = BigInt(data.dueTime);
        if (data.ringTypeId !== undefined) updatePayload.ringTypeId = data.ringTypeId;
        if (data.routeId !== undefined) updatePayload.routeId = data.routeId;
        if (data.vehicleId !== undefined) updatePayload.vehicleId = data.vehicleId;

        return prisma.templateJob.update({ where: { id }, data: updatePayload });
    }

    // soft delete
    static async delete(id: number) {
        const existing = await prisma.templateJob.findUnique({ where: { id } });
        if (!existing || existing.isDeleted) throw ApiError.notFound('Şablon seferi bulunamadı');

        await prisma.templateJob.update({ where: { id }, data: { isDeleted: true } });
        return { success: true };
    }

    // toplu soft delete
    static async bulkDelete(ids: number[]) {
        if (!ids || ids.length === 0) return { success: true, count: 0 };
        const result = await prisma.templateJob.updateMany({
            where: { id: { in: ids } },
            data: { isDeleted: true }
        });
        return { success: true, count: result.count };
    }
}
