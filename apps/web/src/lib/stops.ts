import { api } from './api-client';

export interface Stop {
    id: number;
    name: string;
    description: string | null;
    lat: number;
    lng: number;
    createdAt: string;
    routes?: {
        route: {
            id: number;
            name: string;
            color: string | null;
        }
    }[];
}

export interface PaginatedStops {
    stops: Stop[];
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

export async function getStops(page: number = 1, limit: number = 20, search?: string): Promise<PaginatedStops> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) {
        params.append('search', search);
    }
    const res = await api.get<ApiPaginatedResult<Stop>>(`/stops?${params.toString()}`);

    return {
        stops: res.items || [],
        total: res.meta?.total || 0,
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 20,
        totalPages: res.meta?.totalPages || 1,
    };
}

export async function createStop(data: Partial<Stop>): Promise<Stop> {
    return api.post<Stop>('/stops', data as Record<string, unknown>);
}

export async function updateStop(id: number, data: Partial<Stop>): Promise<Stop> {
    return api.put<Stop>(`/stops/${id}`, data as Record<string, unknown>);
}

export async function deleteStop(id: number): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/stops/${id}`);
}
