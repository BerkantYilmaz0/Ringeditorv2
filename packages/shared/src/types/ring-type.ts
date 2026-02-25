export type RingType = {
    id: number;
    name: string;
    description?: string | null;
    typeId: number;
    color: string;
    isDeleted: boolean;
};

export type RingTypeCreateRequest = {
    name: string;
    description?: string;
    typeId: number;
    color?: string;
};

export type RingTypeUpdateRequest = Partial<RingTypeCreateRequest>;
