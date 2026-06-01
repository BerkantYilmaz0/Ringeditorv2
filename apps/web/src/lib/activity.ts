import { api } from './api-client';

export interface ActivityLogMeta {
    method?: string;
    path?: string;
    status?: number;
    details?: string;
    targetName?: string;
}

export interface ActivityLog {
    id: number;
    action: string;
    entity: string;
    entityId: string | null;
    meta: ActivityLogMeta | null;
    createdAt: string;
    user: { id: string; username: string; role: string };
}

export interface ActivityLogResponse {
    items?: ActivityLog[];
    data?: ActivityLog[];
    total?: number;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
    page?: number;
    limit?: number;
}

export async function getActivityLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    entity?: string;
    from?: string;
    to?: string;
}): Promise<{ data: ActivityLog[]; total: number; page: number; limit: number }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.userId) q.set('userId', params.userId);
    if (params?.entity) q.set('entity', params.entity);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    
    const raw = await api.get<ActivityLogResponse>(`/activity?${q}`);
    
    const data = raw.items ?? raw.data ?? [];
    const total = raw.meta?.total ?? raw.total ?? 0;
    const page = raw.meta?.page ?? raw.page ?? 1;
    const limit = raw.meta?.limit ?? raw.limit ?? 50;
    
    return { data, total, page, limit };
}

export async function clearActivityLogs(): Promise<{ success: boolean; message?: string }> {
    return api.delete<{ success: boolean; message?: string }>('/activity/clear');
}

export async function deleteActivityLog(id: number): Promise<{ success: boolean; message?: string }> {
    return api.delete<{ success: boolean; message?: string }>(`/activity/${id}`);
}
