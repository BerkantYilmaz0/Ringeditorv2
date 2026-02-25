import { api } from './api-client';

export interface Vehicle {
    id: string;
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    trackerId: string | null;
    simNumber: string | null;
    odometerKm: number | null;
    engineHours: number | null;
    isActive: boolean;
    description: string | null;
    driverId: string | null;
    driver?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedVehicles {
    vehicles: Vehicle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface ApiPaginatedResult<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export async function getVehicles(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedVehicles> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) {
        params.append('search', search);
    }
    const res = await api.get<ApiPaginatedResult<Vehicle>>(`/devices?${params.toString()}`);

    return {
        vehicles: res.items || [],
        total: res.meta?.total || 0,
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 10,
        totalPages: res.meta?.totalPages || 1,
    };
}

export async function getVehicle(id: string): Promise<Vehicle> {
    const response = await api.get<{ vehicle: Vehicle }>(`/devices/${id}`);
    return response.vehicle;
}

export async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.post<{ vehicle: Vehicle }>('/devices', data as Record<string, unknown>);
    return response.vehicle;
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.put<{ vehicle: Vehicle }>(`/devices/${id}`, data as Record<string, unknown>);
    return response.vehicle;
}

export async function deleteVehicle(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/devices/${id}`);
}
