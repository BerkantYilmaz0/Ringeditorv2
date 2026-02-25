'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { api } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { Activity, Route as RouteIcon, CarFront, CheckCircle2 } from 'lucide-react';

interface UpcomingJob {
    id: number;
    dueTime: string | number;
    status: string;
    vehicle?: {
        plate: string;
        name: string;
    };
    route?: {
        name: string;
        ringType?: {
            name: string;
        };
    };
}

interface DashboardStats {
    todayJobCount: number;
    totalRoutes: number;
    totalVehicles: number;
    activeVehicles: number;
    upcomingJobs: UpcomingJob[];
}

export default function DashboardPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
    });

    const statCards = [
        { title: 'Bugünkü Seferler', value: stats?.todayJobCount, icon: Activity, trend: '+12% bu hafta' },
        { title: 'Toplam Güzergah', value: stats?.totalRoutes, icon: RouteIcon, trend: 'Aktif kullanımda' },
        { title: 'Toplam Araç', value: stats?.totalVehicles, icon: CarFront, trend: 'Filo kapasitesi' },
        { title: 'Aktif Araçlar', value: stats?.activeVehicles, icon: CheckCircle2, trend: 'Şu an görevde' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm bg-blue">
                    Genel durum özeti ve yaklaşan seferler.
                </p>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/60 flex flex-col justify-center space-y-4 hover:shadow-[0px_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-600">
                                    {card.title}
                                </span>
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>

                            {isLoading ? (
                                <Skeleton className="h-10 w-20" />
                            ) : (
                                <div>
                                    <div className="text-4xl font-bold text-primary mb-1 tracking-tight">
                                        {card.value ?? 0}
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                        {card.trend}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Yaklaşan Seferler Tablosu */}
            <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary">Yaklaşan Seferler</h3>
                </div>

                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-3/4 rounded-xl" />
                    </div>
                ) : !stats?.upcomingJobs || stats.upcomingJobs.length === 0 ? (
                    <div className="p-16 justify-center flex flex-col items-center text-slate-400">
                        <span className="text-sm font-medium">Hiç yaklaşan sefer bulunamadı.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto p-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none rounded-xl">
                                    <TableHead className="font-semibold text-xs text-slate-500 px-4 py-4 rounded-l-xl">Kalkış Vakti</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500">Araç Bilgisi</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500">Güzergah</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500">Ring Tipi</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500 text-right px-4">Durum</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500 text-center px-4 rounded-r-xl">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.upcomingJobs.map((job) => (
                                    <TableRow key={job.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="font-medium whitespace-nowrap px-4 py-5">
                                            <div className="text-slate-900 font-semibold">{format(Number(job.dueTime), 'HH:mm', { locale: tr })}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {format(Number(job.dueTime), 'dd MMM yyyy', { locale: tr })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{job.vehicle?.plate}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{job.vehicle?.name}</div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">{job.route?.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-medium rounded-full px-3">
                                                {job.route?.ringType?.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            {job.status === 'PENDING' && <Badge variant="secondary" className="font-medium rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3">Bekliyor</Badge>}
                                            {job.status === 'IN_PROGRESS' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-medium rounded-full px-3">Devam Ediyor</Badge>}
                                            {job.status === 'COMPLETED' && <Badge variant="outline" className="text-slate-500 border-slate-200 font-medium rounded-full px-3">Tamamlandı</Badge>}
                                        </TableCell>
                                        <TableCell className="text-center px-4">
                                            <button className="text-slate-400 hover:text-primary transition-colors">
                                                •••
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
