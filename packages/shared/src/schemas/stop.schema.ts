import { z } from 'zod';

export const StopCreateSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Durak adı boş olamaz'),
        lat: z.number(),
        lng: z.number(),
        description: z.string().optional(),
    }),
});

export const StopUpdateSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        description: z.string().optional(),
    }),
});

export type StopCreateInput = z.infer<typeof StopCreateSchema>['body'];
export type StopUpdateInput = z.infer<typeof StopUpdateSchema>['body'];

// eski isimle geriye uyumluluk
export const StopSchema = StopCreateSchema;
