import { api } from './api-client';
import { Route } from './routes';

export interface Vehicle {
    id: string;
    plate: string;
    brand?: string;
    model?: string;
    isActive: boolean;
    description?: string;
    driver?: {
        id: string;
        name: string;
    };
}

export interface Job {
    id: number;
    dueTime: number | string;
    status: number;
    type: number;
    vehicleId: string;
    routeId?: number;
    createdAt: string;
    updatedAt: string;
    vehicle?: Vehicle;
    route?: Route;
}

export interface JobFilters {
    vehicleId?: string;
    routeId?: number;
    date?: string;
}

interface JobsResponse {
    items: Record<string, unknown>[];
    meta: Record<string, unknown>;
}

export const getJobs = async (page: number = 1, limit: number = 20, filters?: JobFilters) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
        ...(filters?.routeId && { routeId: filters.routeId.toString() }),
        ...(filters?.date && { date: filters.date }),
    });

    const res = await api.get<JobsResponse>(`/jobs?${params.toString()}`);

    const jobs = res.items.map((job: Record<string, unknown>) => ({
        ...job,
        dueTime: Number(job.dueTime)
    }));

    return {
        data: jobs as Job[],
        meta: res.meta
    };
};

export const createJob = async (data: Partial<Job>) => {
    const res = await api.post<Record<string, unknown>>('/jobs', data as Record<string, unknown>);
    return {
        ...res,
        dueTime: Number(res.dueTime)
    } as Job;
};

export const updateJob = async (id: number, data: Partial<Job>) => {
    const res = await api.put<Record<string, unknown>>(`/jobs/${id}`, data as Record<string, unknown>);
    return {
        ...res,
        dueTime: Number(res.dueTime)
    } as Job;
};

export const deleteJob = async (id: number) => {
    return api.delete<{ success: boolean }>(`/jobs/${id}`);
};

export const bulkDeleteJobs = async (ids: number[]) => {
    return api.post<{ success: boolean; count: number }>('/jobs/bulk-delete', { ids });
};

export const checkJobConflicts = async (items: { vehicleId: string; dueTime: number }[]) => {
    return api.post<Record<string, unknown>>('/jobs/conflicts', { items });
};

export const generateJobsFromTemplate = async (data: { templateId: number; startDate: string; endDate: string }) => {
    return api.post<{ success: boolean; count: number }>('/jobs/generate', data);
};

export const getJobsCalendarStats = async (month: string) => {
    return api.get<Record<string, number>>(`/jobs/calendar-stats?month=${month}`);
};
