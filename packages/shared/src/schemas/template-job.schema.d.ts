import { z } from 'zod';
export declare const TemplateJobCreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            dueTime: z.ZodNumber;
            ringTypeId: z.ZodNumber;
            routeId: z.ZodOptional<z.ZodNumber>;
            vehicleId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }, {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    }, {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    };
}, {
    body: {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    };
}>;
export declare const TemplateJobUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        dueTime: z.ZodOptional<z.ZodNumber>;
        ringTypeId: z.ZodOptional<z.ZodNumber>;
        routeId: z.ZodOptional<z.ZodNumber>;
        vehicleId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
        ringTypeId?: number | undefined;
    }, {
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
        ringTypeId?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
        ringTypeId?: number | undefined;
    };
}, {
    body: {
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
        ringTypeId?: number | undefined;
    };
}>;
export declare const TemplateJobBulkDeleteSchema: z.ZodObject<{
    body: z.ZodObject<{
        ids: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        ids: number[];
    }, {
        ids: number[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        ids: number[];
    };
}, {
    body: {
        ids: number[];
    };
}>;
export type TemplateJobBulkCreateInput = z.infer<typeof TemplateJobCreateSchema>['body'];
export type TemplateJobUpdateInput = z.infer<typeof TemplateJobUpdateSchema>['body'];
export declare const TemplateJobSchema: z.ZodObject<{
    body: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            dueTime: z.ZodNumber;
            ringTypeId: z.ZodNumber;
            routeId: z.ZodOptional<z.ZodNumber>;
            vehicleId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }, {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    }, {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    };
}, {
    body: {
        items: {
            dueTime: number;
            ringTypeId: number;
            vehicleId?: string | undefined;
            routeId?: number | undefined;
        }[];
    };
}>;
//# sourceMappingURL=template-job.schema.d.ts.map