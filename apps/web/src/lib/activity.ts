import { api } from './api-client';

export interface ActivityLog {
    id: number;
    action: string;
    entity: string;
    entityId: string | null;
    meta: unknown;
    createdAt: string;
    user: { id: string; username: string; role: string };
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
    const raw = await api.get<any>(`/activity?${q}`);
    return { data: raw.items ?? raw.data ?? [], total: raw.meta?.total ?? raw.total ?? 0, page: raw.meta?.page ?? raw.page ?? 1, limit: raw.meta?.limit ?? raw.limit ?? 50 };
}
