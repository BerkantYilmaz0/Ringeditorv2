import { api } from './api-client';

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    notificationSound: boolean;
    notificationBrowser: boolean;
    lastLoginAt?: string | null;
    twoFactorEnabled?: boolean;
    createdAt: string;
}

export interface UserCreateInput {
    username: string;
    fullName: string;
    password: string;
    email?: string;
    phone?: string;
    role: UserRole;
    twoFactorEnabled?: boolean;
}

export async function getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: User[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    const raw = await api.get<any>(`/users?${q}`);
    return { data: raw.items ?? raw.data ?? [], total: raw.meta?.total ?? raw.total ?? 0 };
}

export async function getUser(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`);
}

export async function createUser(data: UserCreateInput): Promise<User> {
    return api.post<User>('/users', data as unknown as Record<string, unknown>);
}

export async function updateUser(id: string, data: Partial<Omit<UserCreateInput, 'password'>> & { isActive?: boolean }): Promise<User> {
    return api.put<User>(`/users/${id}`, data as unknown as Record<string, unknown>);
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/users/${id}`);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return api.patch<{ success: boolean }>('/auth/change-password', { currentPassword, newPassword });
}

export async function updateProfile(data: { username?: string; notificationSound?: boolean; notificationBrowser?: boolean }): Promise<User> {
    return api.patch<User>('/auth/profile', data);
}
