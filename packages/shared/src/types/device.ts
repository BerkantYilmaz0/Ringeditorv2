export type Vehicle = {
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
    lastLat: number | null;
    lastLng: number | null;
    description: string | null;
    driverId: string | null;
    createdAt: string;
    updatedAt: string;
};

export type VehicleCreateRequest = {
    plate: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    trackerId?: string;
    simNumber?: string;
    description?: string;
    driverId?: string;
    isActive?: boolean;
};

export type VehicleUpdateRequest = Partial<VehicleCreateRequest>;
