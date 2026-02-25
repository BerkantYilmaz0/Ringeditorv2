import { z } from 'zod';
export declare const UserCreateSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodString;
        password: z.ZodString;
        fullName: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<["ADMIN", "MANAGER", "OPERATOR", "VIEWER"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        fullName: string;
        password: string;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
    }, {
        username: string;
        fullName: string;
        password: string;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        username: string;
        fullName: string;
        password: string;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
    };
}, {
    body: {
        username: string;
        fullName: string;
        password: string;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
    };
}>;
export declare const UserUpdateSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        fullName: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<["ADMIN", "MANAGER", "OPERATOR", "VIEWER"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        username?: string | undefined;
        fullName?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
        password?: string | undefined;
    }, {
        username?: string | undefined;
        fullName?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
        password?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        username?: string | undefined;
        fullName?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
        password?: string | undefined;
    };
}, {
    body: {
        username?: string | undefined;
        fullName?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        role?: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER" | undefined;
        isActive?: boolean | undefined;
        password?: string | undefined;
    };
}>;
export type UserCreateInput = z.infer<typeof UserCreateSchema>['body'];
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>['body'];
//# sourceMappingURL=user.schema.d.ts.map