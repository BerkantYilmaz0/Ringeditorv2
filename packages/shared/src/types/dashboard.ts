import type { Job } from './job';

export type RecentActivity = {
    type: string;
    description: string;
    createdAt: string;
};

export type DashboardStatsData = {
    todayJobCount: number;
    activeRouteCount: number;
    upcomingJobs: Job[];
    recentActivity?: RecentActivity[];
};

export type DashboardStats = {
    statusCode: number;
    data: DashboardStatsData;
};
