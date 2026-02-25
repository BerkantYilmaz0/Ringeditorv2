import { z } from 'zod';

export const RouteStopAddSchema = z.object({
    body: z.object({
        stopId: z.number().int(),
        sequence: z.number().int(),
    }),
});

export const RouteStopReorderSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            stopId: z.number().int(),
            sequence: z.number().int(),
        })),
    }),
});

export type RouteStopAddInput = z.infer<typeof RouteStopAddSchema>['body'];
export type RouteStopReorderInput = z.infer<typeof RouteStopReorderSchema>['body'];

// eski isimle geriye uyumluluk
export const RingStopSchema = RouteStopAddSchema;
