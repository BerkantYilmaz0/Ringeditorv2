import { api } from './api-client';
import { RingType } from './ring-types';
import { Stop } from './stops';

export interface RouteStop {
    sequence: number;
    stopId: number;
    stop?: Stop;
}

export interface GeoJSONLineString {
    type: 'LineString';
    coordinates: [number, number][];
}

export interface Route {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    geometry: GeoJSONLineString | null;
    ringTypeId: number;
    ringType?: RingType;
    stops?: RouteStop[];
    createdAt?: string;
}

export interface PaginatedRoutes {
    routes: Route[];
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

export async function getRoutes(page: number = 1, limit: number = 20): Promise<PaginatedRoutes> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    const res = await api.get<ApiPaginatedResult<Route>>(`/routes?${params.toString()}`);

    return {
        routes: res.items || [],
        total: res.meta?.total || 0,
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 20,
        totalPages: res.meta?.totalPages || 1,
    };
}

export async function createRoute(data: Partial<Route> & { stops: { stopId: number; sequence: number }[] }): Promise<Route> {
    return api.post<Route>('/routes', data as Record<string, unknown>);
}

export async function updateRoute(id: number, data: Partial<Route> & { stops?: { stopId: number; sequence: number }[] }): Promise<Route> {
    return api.put<Route>(`/routes/${id}`, data as Record<string, unknown>);
}

export async function deleteRoute(id: number): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/routes/${id}`);
}

interface OsrmResponse {
    code: string;
    routes?: { geometry: GeoJSONLineString }[];
}

/**
 * OSRM API'sinden seçilen duraklara göre (lon,lat formatında) yol çizimi rotası alır.
 * @param coordinates [{lat, lng}, {lat, lng}, ...] sıralı koordinatlar dizisi
 */
export async function getOsrmRoute(coordinates: { lat: number, lng: number }[]): Promise<GeoJSONLineString | null> {
    if (coordinates.length < 2) return null;

    // OSRM expects: longitude,latitude;longitude,latitude
    const coordsString = coordinates.map(c => `${c.lng},${c.lat}`).join(';');

    try {
        const data = await api.get<OsrmResponse>(`/routes/osrm?coordinates=${coordsString}`);

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            // İlk ve en optimal rotanın geometry (GeoJSON LineString) verisini dön
            return data.routes[0].geometry;
        }
        return null; // Rota bulunamadıysa
    } catch (e) {
        console.error("OSRM Fetch Error:", e);
        return null;
    }
}
