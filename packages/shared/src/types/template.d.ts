export type Template = {
    id: number;
    name: string;
    description: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
};
export type TemplateCreateRequest = {
    name: string;
    description?: string;
};
export type TemplateUpdateRequest = Partial<TemplateCreateRequest>;
//# sourceMappingURL=template.d.ts.map