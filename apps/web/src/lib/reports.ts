import { api } from './api-client';

export type Period = 'week' | 'month' | '3months' | 'custom';

function buildQuery(period: Period, from?: string, to?: string) {
    const q = new URLSearchParams({ period });
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    return q.toString();
}

export interface ReportSummary {
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    inProgressJobs: number;
    pendingJobs: number;
    completionRate: number;
    cancellationRate: number;
    avgOccupancy: number;
    activeVehicles: number;
    activeDrivers: number;
    period: { start: string; end: string };
}

export interface TimelineItem { date: string; total: number; completed: number; cancelled: number; pending: number; }
export interface VehicleStat { id: string; plate: string; brand: string; model: string; capacity: number; driver: { name: string } | null; jobCount: number; completedCount: number; completionRate: number; avgOccupancy: number; }
export interface RouteStat { id: number; name: string; color: string; ringType: { name: string; color: string } | null; jobCount: number; completedCount: number; peakHour: string | null; }
export interface DriverStat { id: string; name: string; phone: string | null; jobCount: number; completedCount: number; activeDays: number; vehicles: { id: string; plate: string }[]; }

export async function getReportSummary(period: Period, from?: string, to?: string): Promise<ReportSummary> {
    return api.get<ReportSummary>(`/reports/summary?${buildQuery(period, from, to)}`);
}

export async function getTimeline(period: Period, from?: string, to?: string): Promise<TimelineItem[]> {
    return api.get<TimelineItem[]>(`/reports/timeline?${buildQuery(period, from, to)}`);
}

export async function getVehicleStats(period: Period, from?: string, to?: string): Promise<VehicleStat[]> {
    return api.get<VehicleStat[]>(`/reports/vehicles?${buildQuery(period, from, to)}`);
}

export async function getRouteStats(period: Period, from?: string, to?: string): Promise<RouteStat[]> {
    return api.get<RouteStat[]>(`/reports/routes?${buildQuery(period, from, to)}`);
}

export async function getDriverStats(period: Period, from?: string, to?: string): Promise<DriverStat[]> {
    return api.get<DriverStat[]>(`/reports/drivers?${buildQuery(period, from, to)}`);
}
