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
        capacity: z.number().int().positive().optional().nullable(),
        lastServiceDate: z.string().optional().nullable(),
        nextServiceDate: z.string().optional().nullable(),
        vehicleStatus: z.enum(['AVAILABLE', 'MAINTENANCE']).optional(),
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
        capacity: z.number().int().positive().optional().nullable(),
        lastServiceDate: z.string().optional().nullable(),
        nextServiceDate: z.string().optional().nullable(),
        vehicleStatus: z.enum(['AVAILABLE', 'MAINTENANCE']).optional(),
    }),
});

export type VehicleCreateInput = z.infer<typeof VehicleCreateSchema>['body'];
export type VehicleUpdateInput = z.infer<typeof VehicleUpdateSchema>['body'];

export const DeviceSchema = VehicleCreateSchema;
export const DeviceUpdateSchema = VehicleUpdateSchema;
export type DeviceCreateInput = VehicleCreateInput;
export type DeviceUpdateInput = VehicleUpdateInput;
