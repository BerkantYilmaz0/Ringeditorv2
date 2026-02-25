import { z } from 'zod';
export declare const RingTypeCreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        typeId: z.ZodNumber;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    }, {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    };
}, {
    body: {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    };
}>;
export declare const RingTypeUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        typeId: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | null | undefined;
        typeId?: number | undefined;
    }, {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | null | undefined;
        typeId?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | null | undefined;
        typeId?: number | undefined;
    };
}, {
    body: {
        name?: string | undefined;
        color?: string | undefined;
        description?: string | null | undefined;
        typeId?: number | undefined;
    };
}>;
export type RingTypeCreateInput = z.infer<typeof RingTypeCreateSchema>['body'];
export type RingTypeUpdateInput = z.infer<typeof RingTypeUpdateSchema>['body'];
export declare const RingTypeSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        typeId: z.ZodNumber;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    }, {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    };
}, {
    body: {
        name: string;
        typeId: number;
        color?: string | undefined;
        description?: string | null | undefined;
    };
}>;
//# sourceMappingURL=ring-type.schema.d.ts.map