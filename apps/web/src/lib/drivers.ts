import { api } from './api-client';

export interface Driver {
    id: string;
    name: string;
    phone: string | null;
}

export async function getDrivers(): Promise<Driver[]> {
    return api.get<Driver[]>('/drivers');
}
