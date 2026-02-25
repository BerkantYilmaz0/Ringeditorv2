export type Route = {
    id: number;
    name: string;
    geometry: Record<string, unknown> | null;
    color: string | null;
    description: string | null;
    ringTypeId: number;
    createdAt: string;
    updatedAt: string;
};
export type RouteCreateRequest = {
    name: string;
    ringTypeId: number;
    color?: string;
    description?: string;
    geometry?: Record<string, unknown>;
};
export type RouteUpdateRequest = Partial<RouteCreateRequest>;
//# sourceMappingURL=route.d.ts.map