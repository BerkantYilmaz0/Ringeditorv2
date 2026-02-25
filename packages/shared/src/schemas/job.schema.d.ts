import { z } from 'zod';
export declare const JobCreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        vehicleId: z.ZodString;
        dueTime: z.ZodNumber;
        routeId: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    }, {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    };
}, {
    body: {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    };
}>;
export declare const JobUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        vehicleId: z.ZodOptional<z.ZodString>;
        dueTime: z.ZodOptional<z.ZodNumber>;
        routeId: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: number | undefined;
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
    }, {
        type?: number | undefined;
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        type?: number | undefined;
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
    };
}, {
    body: {
        type?: number | undefined;
        status?: number | undefined;
        dueTime?: number | undefined;
        vehicleId?: string | undefined;
        routeId?: number | undefined;
    };
}>;
export declare const JobConflictCheckSchema: z.ZodObject<{
    body: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            vehicleId: z.ZodString;
            dueTime: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            dueTime: number;
            vehicleId: string;
        }, {
            dueTime: number;
            vehicleId: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            dueTime: number;
            vehicleId: string;
        }[];
    }, {
        items: {
            dueTime: number;
            vehicleId: string;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        items: {
            dueTime: number;
            vehicleId: string;
        }[];
    };
}, {
    body: {
        items: {
            dueTime: number;
            vehicleId: string;
        }[];
    };
}>;
export declare const JobBulkDeleteSchema: z.ZodObject<{
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
export declare const JobGenerateSchema: z.ZodObject<{
    body: z.ZodObject<{
        templateId: z.ZodNumber;
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        templateId: number;
        startDate: string;
        endDate: string;
    }, {
        templateId: number;
        startDate: string;
        endDate: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        templateId: number;
        startDate: string;
        endDate: string;
    };
}, {
    body: {
        templateId: number;
        startDate: string;
        endDate: string;
    };
}>;
export type JobCreateInput = z.infer<typeof JobCreateSchema>['body'];
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>['body'];
export type JobConflictCheckInput = z.infer<typeof JobConflictCheckSchema>['body'];
export type JobBulkDeleteInput = z.infer<typeof JobBulkDeleteSchema>['body'];
export type JobGenerateInput = z.infer<typeof JobGenerateSchema>['body'];
export declare const JobSchema: z.ZodObject<{
    body: z.ZodObject<{
        vehicleId: z.ZodString;
        dueTime: z.ZodNumber;
        routeId: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    }, {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    };
}, {
    body: {
        dueTime: number;
        vehicleId: string;
        type?: number | undefined;
        status?: number | undefined;
        routeId?: number | undefined;
    };
}>;
//# sourceMappingURL=job.schema.d.ts.map