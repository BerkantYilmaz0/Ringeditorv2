import { api } from './api-client';

export interface Driver {
    id: string;
    name: string;
    phone: string | null;
    licenseType: string | null;
    licenseExpiry: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    vehicles: { id: string; plate: string; brand: string; model: string }[];
    todayJobCount?: number;
    weekJobCount?: number;
    totalJobCount?: number;
    daysToExpiry?: number | null;
}

export interface DriverDetail extends Driver {
    recentJobs: {
        id: number;
        dueTime: string;
        status: string;
        route: { name: string; ringType: { name: string; color: string } } | null;
        vehicle: { plate: string } | null;
    }[];
}

export interface DriverCreateInput {
    name: string;
    phone?: string;
    licenseType?: string;
    licenseExpiry?: string;
    address?: string;
    notes?: string;
}

export async function getDrivers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
}): Promise<{ data: Driver[]; total: number; page: number; limit: number }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.includeInactive) q.set('includeInactive', 'true');
    const raw = await api.get<any>(`/drivers?${q}`);
    return { data: raw.items ?? raw.data ?? [], total: raw.meta?.total ?? raw.total ?? 0, page: raw.meta?.page ?? raw.page ?? 1, limit: raw.meta?.limit ?? raw.limit ?? 50 };
}

export async function getDriver(id: string): Promise<DriverDetail> {
    return api.get<DriverDetail>(`/drivers/${id}`);
}

export async function createDriver(data: DriverCreateInput): Promise<Driver> {
    return api.post<Driver>('/drivers', data as unknown as Record<string, unknown>);
}

export async function updateDriver(id: string, data: Partial<DriverCreateInput> & { isActive?: boolean }): Promise<Driver> {
    return api.put<Driver>(`/drivers/${id}`, data as unknown as Record<string, unknown>);
}

export async function deleteDriver(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/drivers/${id}`);
}
