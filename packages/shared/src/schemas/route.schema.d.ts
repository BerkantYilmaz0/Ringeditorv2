import { z } from 'zod';
export declare const RouteCreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        ringTypeId: z.ZodNumber;
        color: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        geometry: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    }, {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    };
}, {
    body: {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    };
}>;
export declare const RouteUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        ringTypeId: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        geometry: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | undefined;
        ringTypeId?: number | undefined;
        geometry?: Record<string, unknown> | undefined;
    }, {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | undefined;
        ringTypeId?: number | undefined;
        geometry?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | undefined;
        ringTypeId?: number | undefined;
        geometry?: Record<string, unknown> | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | undefined;
        ringTypeId?: number | undefined;
        geometry?: Record<string, unknown> | undefined;
    };
}>;
export type RouteCreateInput = z.infer<typeof RouteCreateSchema>['body'];
export type RouteUpdateInput = z.infer<typeof RouteUpdateSchema>['body'];
export declare const RouteSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        ringTypeId: z.ZodNumber;
        color: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        geometry: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    }, {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    };
}, {
    body: {
        name: string;
        ringTypeId: number;
        color?: string | undefined;
        description?: string | undefined;
        geometry?: Record<string, unknown> | undefined;
    };
}>;
//# sourceMappingURL=route.schema.d.ts.map