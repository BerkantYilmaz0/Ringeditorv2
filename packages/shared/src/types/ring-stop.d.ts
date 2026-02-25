export type RouteStop = {
    routeId: number;
    stopId: number;
    sequence: number;
};
export type RouteStopCreateRequest = {
    stopId: number;
    sequence: number;
};
export type ReorderItem = {
    stopId: number;
    sequence: number;
};
export type ReorderRequest = {
    items: ReorderItem[];
};
//# sourceMappingURL=ring-stop.d.ts.map