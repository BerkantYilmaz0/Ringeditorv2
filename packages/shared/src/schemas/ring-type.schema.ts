import { z } from 'zod';

export const RingTypeCreateSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Ring tipi adı boş olamaz'),
        description: z.string().max(500).optional().nullable(),
        typeId: z.number().int(),
        color: z.string().optional(),
    }),
});

export const RingTypeUpdateSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().max(500).optional().nullable(),
        typeId: z.number().int().optional(),
        color: z.string().optional(),
    }),
});

export type RingTypeCreateInput = z.infer<typeof RingTypeCreateSchema>['body'];
export type RingTypeUpdateInput = z.infer<typeof RingTypeUpdateSchema>['body'];

// eski isimle geriye uyumluluk
export const RingTypeSchema = RingTypeCreateSchema;
