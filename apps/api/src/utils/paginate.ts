export const pageSkip = (page: number, limit: number): number => (page - 1) * limit;

export const pageMeta = (total: number, page: number, limit: number) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});
