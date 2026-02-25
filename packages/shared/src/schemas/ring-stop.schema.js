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
// eski isimle geriye uyumluluk
export const RingStopSchema = RouteStopAddSchema;
//# sourceMappingURL=ring-stop.schema.js.map