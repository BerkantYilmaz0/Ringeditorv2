import { z } from 'zod';

export const JobCreateSchema = z.object({
    body: z.object({
        vehicleId: z.string().min(1, 'Araç ID boş olamaz'),
        dueTime: z.number(),
        routeId: z.number().int().optional(),
        status: z.number().int().optional(),
        type: z.number().int().optional(),
    }),
});

export const JobUpdateSchema = z.object({
    body: z.object({
        vehicleId: z.string().optional(),
        dueTime: z.number().optional(),
        routeId: z.number().int().optional(),
        status: z.number().int().optional(),
        type: z.number().int().optional(),
    }),
});

export const JobConflictCheckSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            vehicleId: z.string(),
            dueTime: z.number(),
        })),
    }),
});

export const JobBulkDeleteSchema = z.object({
    body: z.object({
        ids: z.array(z.number().int()).min(1, 'En az bir ID gerekli'),
    }),
});

export const JobGenerateSchema = z.object({
    body: z.object({
        templateId: z.number().int(),
        startDate: z.string().min(1, 'Başlangıç tarihi gerekli'),
        endDate: z.string().min(1, 'Bitiş tarihi gerekli'),
    }),
});

export type JobCreateInput = z.infer<typeof JobCreateSchema>['body'];
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>['body'];
export type JobConflictCheckInput = z.infer<typeof JobConflictCheckSchema>['body'];
export type JobBulkDeleteInput = z.infer<typeof JobBulkDeleteSchema>['body'];
export type JobGenerateInput = z.infer<typeof JobGenerateSchema>['body'];

// eski isimle geriye uyumluluk
export const JobSchema = JobCreateSchema;

