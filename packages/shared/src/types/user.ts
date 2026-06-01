export type User = {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
    isActive: boolean;
    twoFactorEnabled: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type UserCreateRequest = {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    phone?: string;
    role?: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
    isActive?: boolean;
    twoFactorEnabled?: boolean;
};

export type UserUpdateRequest = {
    username?: string;
    password?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
    isActive?: boolean;
    twoFactorEnabled?: boolean;
};
