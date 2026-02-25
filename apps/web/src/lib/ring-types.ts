import { api } from './api-client';

export interface RingType {
    id: number;
    name: string;
    description: string | null;
    typeId: number;
    color: string;
    isDeleted: boolean;
}

export async function getRingTypes(): Promise<RingType[]> {
    return api.get<RingType[]>('/ring-types');
}

export async function createRingType(data: Partial<RingType>): Promise<RingType> {
    const response = await api.post<{ ringType: RingType }>('/ring-types', data as Record<string, unknown>);
    return response.ringType;
}

export async function updateRingType(id: number, data: Partial<RingType>): Promise<RingType> {
    const response = await api.put<{ ringType: RingType }>(`/ring-types/${id}`, data as Record<string, unknown>);
    return response.ringType;
}

export async function deleteRingType(id: number): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/ring-types/${id}`);
}
