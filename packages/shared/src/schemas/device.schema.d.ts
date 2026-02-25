import { z } from 'zod';
export declare const VehicleCreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        plate: z.ZodString;
        brand: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
        trackerId: z.ZodOptional<z.ZodString>;
        simNumber: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        driverId: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    }, {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    };
}, {
    body: {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    };
}>;
export declare const VehicleUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        plate: z.ZodOptional<z.ZodString>;
        brand: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
        trackerId: z.ZodOptional<z.ZodString>;
        simNumber: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        driverId: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        isActive?: boolean | undefined;
        plate?: string | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    }, {
        model?: string | undefined;
        isActive?: boolean | undefined;
        plate?: string | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        model?: string | undefined;
        isActive?: boolean | undefined;
        plate?: string | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    };
}, {
    body: {
        model?: string | undefined;
        isActive?: boolean | undefined;
        plate?: string | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    };
}>;
export type VehicleCreateInput = z.infer<typeof VehicleCreateSchema>['body'];
export type VehicleUpdateInput = z.infer<typeof VehicleUpdateSchema>['body'];
export declare const DeviceSchema: z.ZodObject<{
    body: z.ZodObject<{
        plate: z.ZodString;
        brand: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
        trackerId: z.ZodOptional<z.ZodString>;
        simNumber: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        driverId: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    }, {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    };
}, {
    body: {
        plate: string;
        model?: string | undefined;
        isActive?: boolean | undefined;
        brand?: string | undefined;
        year?: number | undefined;
        color?: string | undefined;
        trackerId?: string | undefined;
        simNumber?: string | undefined;
        description?: string | undefined;
        driverId?: string | undefined;
    };
}>;
export type DeviceCreateInput = VehicleCreateInput;
export type DeviceUpdateInput = VehicleUpdateInput;
//# sourceMappingURL=device.schema.d.ts.map