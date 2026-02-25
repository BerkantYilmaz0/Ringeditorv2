import { z } from 'zod';

export const LoginSchema = z.object({
    body: z.object({
        username: z.string().min(1, 'Kullanıcı adı boş olamaz'),
        password: z.string().min(1, 'Şifre boş olamaz'),
    }),
});

export type LoginInput = z.infer<typeof LoginSchema>['body'];
