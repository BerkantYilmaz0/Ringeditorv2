import { api } from './api-client';
import { Route } from './routes';
import { Vehicle } from './devices';

export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type JobType = 'REGULAR' | 'EXTRA';

export interface Job {
    id: number;
    dueTime: number;
    status: JobStatus;
    type: JobType;
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

export interface CreateJobInput {
    vehicleId: string;
    dueTime: number;
    routeId?: number;
    status?: JobStatus;
    type?: JobType;
}

interface JobsApiResponse {
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

    const res = await api.get<JobsApiResponse>(`/jobs?${params.toString()}`);

    const jobs = res.items.map((job: Record<string, unknown>) => ({
        ...job,
        dueTime: new Date(job.dueTime as string).getTime(),
    }));

    return { data: jobs as Job[], meta: res.meta };
};

export const createJob = async (data: CreateJobInput): Promise<Job> => {
    const res = await api.post<Record<string, unknown>>('/jobs', data as unknown as Record<string, unknown>);
    return { ...res, dueTime: new Date(res.dueTime as string).getTime() } as Job;
};

export const updateJob = async (id: number, data: Partial<CreateJobInput>): Promise<Job> => {
    const res = await api.put<Record<string, unknown>>(`/jobs/${id}`, data as unknown as Record<string, unknown>);
    return { ...res, dueTime: new Date(res.dueTime as string).getTime() } as Job;
};

export const deleteJob = async (id: number) => {
    return api.delete<{ success: boolean }>(`/jobs/${id}`);
};

export const bulkDeleteJobs = async (ids: number[]) => {
    return api.post<{ success: boolean; count: number }>('/jobs/bulk-delete', { ids });
};

export const checkJobConflicts = async (items: { vehicleId: string; dueTime: number }[]) => {
    return api.post<Record<string, unknown>>('/jobs/check-conflicts', { items });
};

export const generateJobsFromTemplate = async (data: { templateId: number; startDate: string; endDate: string }) => {
    return api.post<{ success: boolean; count: number }>('/jobs/generate', data);
};

export const getJobsCalendarStats = async (month: string) => {
    return api.get<Record<string, number>>(`/jobs/calendar-stats?month=${month}`);
};
