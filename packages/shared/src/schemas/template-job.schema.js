import { z } from 'zod';
export const TemplateJobCreateSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            dueTime: z.number(),
            ringTypeId: z.number().int(),
            routeId: z.number().int().optional(),
            vehicleId: z.string().optional(),
        })),
    }),
});
export const TemplateJobUpdateSchema = z.object({
    body: z.object({
        dueTime: z.number().optional(),
        ringTypeId: z.number().int().optional(),
        routeId: z.number().int().optional(),
        vehicleId: z.string().optional(),
        status: z.number().int().optional(),
    }),
});
export const TemplateJobBulkDeleteSchema = z.object({
    body: z.object({
        ids: z.array(z.number().int()).min(1, 'En az bir ID gerekli'),
    }),
});
// eski isimle geriye uyumluluk
export const TemplateJobSchema = TemplateJobCreateSchema;
//# sourceMappingURL=template-job.schema.js.map