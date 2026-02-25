export type Job = {
    id: number;
    dueTime: number;
    status: number;
    type: number;
    vehicleId: string;
    routeId: number | null;
    createdAt: string;
    updatedAt: string;
};

export type JobCreateRequest = {
    vehicleId: string;
    dueTime: number;
    routeId?: number;
    status?: number;
    type?: number;
};

export type JobUpdateRequest = Partial<JobCreateRequest>;

export type CheckConflictItem = {
    vehicleId: string;
    dueTime: number;
};

export type CheckConflictRequest = {
    items: CheckConflictItem[];
};

export type ConflictResponseItem = {
    vehicleId: string;
    dueTime: number;
    existingJobId: number;
};

export type CheckConflictResponse = {
    hasConflicts: boolean;
    conflicts: ConflictResponseItem[];
};
