import { z } from 'zod';

export const StopCreateSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Durak adı boş olamaz'),
        lat: z.number().min(-90, 'Enlem -90 ile 90 arasında olmalı').max(90, 'Enlem -90 ile 90 arasında olmalı'),
        lng: z.number().min(-180, 'Boylam -180 ile 180 arasında olmalı').max(180, 'Boylam -180 ile 180 arasında olmalı'),
        description: z.string().optional(),
    }),
});

export const StopUpdateSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
        description: z.string().optional(),
    }),
});

export type StopCreateInput = z.infer<typeof StopCreateSchema>['body'];
export type StopUpdateInput = z.infer<typeof StopUpdateSchema>['body'];

