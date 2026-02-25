import type { User } from './user';
export type LoginRequest = {
    username: string;
    password: string;
};
export type LoginResponse = {
    statusCode: number;
    data: {
        token: string;
        expiresIn: number;
        user: Omit<User, 'lastLoginAt' | 'createdAt' | 'updatedAt'>;
    };
};
//# sourceMappingURL=auth.d.ts.map