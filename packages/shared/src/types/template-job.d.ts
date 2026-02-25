export type TemplateJob = {
    id: number;
    dueTime: number;
    status: number;
    isDeleted: boolean;
    templateId: number;
    ringTypeId: number;
    routeId: number | null;
    vehicleId: string | null;
    createdAt: string;
    updatedAt: string;
};
export type TemplateJobCreateItem = {
    dueTime: number;
    ringTypeId: number;
    routeId?: number;
    vehicleId?: string;
};
export type TemplateJobsCreateRequest = {
    items: TemplateJobCreateItem[];
};
export type TemplateJobUpdateRequest = {
    dueTime?: number;
    ringTypeId?: number;
    routeId?: number;
    vehicleId?: string;
    status?: number;
};
//# sourceMappingURL=template-job.d.ts.map