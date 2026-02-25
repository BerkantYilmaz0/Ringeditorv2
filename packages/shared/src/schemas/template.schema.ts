import { z } from 'zod';

export const TemplateCreateSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Şablon adı boş olamaz'),
        description: z.string().optional(),
    }),
});

export const TemplateUpdateSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
    }),
});

export type TemplateCreateInput = z.infer<typeof TemplateCreateSchema>['body'];
export type TemplateUpdateInput = z.infer<typeof TemplateUpdateSchema>['body'];

// eski isimle geriye uyumluluk
export const TemplateSchema = TemplateCreateSchema;
