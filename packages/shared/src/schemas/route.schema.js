import { z } from 'zod';
export const RouteCreateSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Güzergah adı boş olamaz'),
        ringTypeId: z.number().int(),
        color: z.string().optional(),
        description: z.string().optional(),
        geometry: z.record(z.unknown()).optional(),
    }),
});
export const RouteUpdateSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        ringTypeId: z.number().int().optional(),
        color: z.string().optional(),
        description: z.string().optional(),
        geometry: z.record(z.unknown()).optional(),
    }),
});
// eski isimle geriye uyumluluk
export const RouteSchema = RouteCreateSchema;
//# sourceMappingURL=route.schema.js.map