import { z } from 'zod';
export declare const LoginSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        username: string;
        password: string;
    }, {
        username: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        username: string;
        password: string;
    };
}, {
    body: {
        username: string;
        password: string;
    };
}>;
export type LoginInput = z.infer<typeof LoginSchema>['body'];
//# sourceMappingURL=auth.schema.d.ts.map