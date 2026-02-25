export type Stop = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    description: string | null;
    createdAt: string;
};

export type StopCreateRequest = {
    name: string;
    lat: number;
    lng: number;
    description?: string;
};

export type StopUpdateRequest = Partial<StopCreateRequest>;
