import { z } from 'zod';

const UserRole = z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']);

export const UserCreateSchema = z.object({
    body: z.object({
        username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı'),
        password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
        fullName: z.string().min(1, 'Ad soyad boş olamaz'),
        email: z.string().email('Geçersiz e-posta').optional(),
        phone: z.string().optional(),
        role: UserRole.optional(),
        isActive: z.boolean().optional(),
    }),
});

export const UserUpdateSchema = z.object({
    body: z.object({
        username: z.string().min(3).optional(),
        password: z.string().min(6).optional(),
        fullName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: UserRole.optional(),
        isActive: z.boolean().optional(),
    }),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>['body'];
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>['body'];
