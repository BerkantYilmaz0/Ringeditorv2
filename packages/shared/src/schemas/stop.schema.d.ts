import { z } from 'zod';
export declare const StopCreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    }, {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    };
}, {
    body: {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    };
}>;
export declare const StopUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        lat: z.ZodOptional<z.ZodNumber>;
        lng: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        description?: string | undefined;
        lat?: number | undefined;
        lng?: number | undefined;
    }, {
        name?: string | undefined;
        description?: string | undefined;
        lat?: number | undefined;
        lng?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        description?: string | undefined;
        lat?: number | undefined;
        lng?: number | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        description?: string | undefined;
        lat?: number | undefined;
        lng?: number | undefined;
    };
}>;
export type StopCreateInput = z.infer<typeof StopCreateSchema>['body'];
export type StopUpdateInput = z.infer<typeof StopUpdateSchema>['body'];
export declare const StopSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    }, {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    };
}, {
    body: {
        name: string;
        lat: number;
        lng: number;
        description?: string | undefined;
    };
}>;
//# sourceMappingURL=stop.schema.d.ts.map