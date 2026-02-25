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
// eski isimle geriye uyumluluk
export const TemplateSchema = TemplateCreateSchema;
//# sourceMappingURL=template.schema.js.map