import { api } from './api-client';

export interface Template {
    id: number;
    name: string;
    description?: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        jobs: number;
    };
}

export interface TemplateJob {
    id: number;
    templateId: number;
    dueTime: number;
    status: string;
    ringTypeId: number;
    routeId: number;
    vehicleId?: string;
    route?: {
        name: string;
    };
    vehicle?: {
        plate: string;
    };
    ringType?: {
        name: string;
        color: string;
    };
}

export const getTemplates = async () => {
    return api.get<Template[]>('/templates');
};

export const getTemplateById = async (id: number) => {
    return api.get<Template>(`/templates/${id}`);
};

export const createTemplate = async (data: { name: string; description?: string }) => {
    return api.post<Template>('/templates', data);
};

export const updateTemplate = async (id: number, data: { name?: string; description?: string }) => {
    return api.put<Template>(`/templates/${id}`, data);
};

export const deleteTemplate = async (id: number) => {
    return api.delete<{ success: boolean }>(`/templates/${id}`);
};


export const getTemplateJobs = async (templateId: number) => {
    const jobs = await api.get<TemplateJob[]>(`/template-jobs/${templateId}`);
    return jobs.map(j => ({ ...j, dueTime: new Date(j.dueTime as unknown as string).getTime() }));
};

export const createTemplateJob = async (data: Partial<TemplateJob>) => {
    return api.post<TemplateJob[]>(`/template-jobs/${data.templateId}`, { items: [data] });
};

export const updateTemplateJob = async (id: number, data: Partial<TemplateJob>) => {
    return api.put<TemplateJob>(`/template-jobs/item/${id}`, data);
};

export const bulkCreateTemplateJobs = async (templateId: number, items: Partial<TemplateJob>[]) => {
    return api.post<TemplateJob[]>(`/template-jobs/${templateId}`, { items });
};

export const bulkDeleteTemplateJobs = async (templateId: number, ids: number[]) => {
    // Toplu silme isteği /template-jobs/bulk-delete/item rotasında BulkDelete olarak ayarlandı, POST atarak siliyoruz (Body ile)
    return api.post<{ success: boolean; count: number }>(`/template-jobs/bulk-delete/item`, { ids });
};

export const deleteTemplateJob = async (id: number) => {
    return api.delete<{ success: boolean }>(`/template-jobs/item/${id}`);
};
