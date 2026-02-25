import { z } from 'zod';
export declare const RouteStopAddSchema: z.ZodObject<{
    body: z.ZodObject<{
        stopId: z.ZodNumber;
        sequence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        stopId: number;
        sequence: number;
    }, {
        stopId: number;
        sequence: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        stopId: number;
        sequence: number;
    };
}, {
    body: {
        stopId: number;
        sequence: number;
    };
}>;
export declare const RouteStopReorderSchema: z.ZodObject<{
    body: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            stopId: z.ZodNumber;
            sequence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            stopId: number;
            sequence: number;
        }, {
            stopId: number;
            sequence: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            stopId: number;
            sequence: number;
        }[];
    }, {
        items: {
            stopId: number;
            sequence: number;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        items: {
            stopId: number;
            sequence: number;
        }[];
    };
}, {
    body: {
        items: {
            stopId: number;
            sequence: number;
        }[];
    };
}>;
export type RouteStopAddInput = z.infer<typeof RouteStopAddSchema>['body'];
export type RouteStopReorderInput = z.infer<typeof RouteStopReorderSchema>['body'];
export declare const RingStopSchema: z.ZodObject<{
    body: z.ZodObject<{
        stopId: z.ZodNumber;
        sequence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        stopId: number;
        sequence: number;
    }, {
        stopId: number;
        sequence: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        stopId: number;
        sequence: number;
    };
}, {
    body: {
        stopId: number;
        sequence: number;
    };
}>;
//# sourceMappingURL=ring-stop.schema.d.ts.map