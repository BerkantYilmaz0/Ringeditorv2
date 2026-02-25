import { z } from 'zod';
export const VehicleCreateSchema = z.object({
    body: z.object({
        plate: z.string().min(1, 'Plaka boş olamaz'),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().int().optional(),
        color: z.string().optional(),
        trackerId: z.string().optional(),
        simNumber: z.string().optional(),
        description: z.string().optional(),
        driverId: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
});
export const VehicleUpdateSchema = z.object({
    body: z.object({
        plate: z.string().min(1).optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().int().optional(),
        color: z.string().optional(),
        trackerId: z.string().optional(),
        simNumber: z.string().optional(),
        description: z.string().optional(),
        driverId: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
});
// eski isimle geriye uyumluluk
export const DeviceSchema = VehicleCreateSchema;
//# sourceMappingURL=device.schema.js.map