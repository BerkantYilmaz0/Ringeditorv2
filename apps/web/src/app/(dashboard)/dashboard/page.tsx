'use client';

import { useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Activity, Route as RouteIcon, CarFront, CheckCircle2, Clock, MapPin, Bus, Tag } from 'lucide-react';

interface UpcomingJob {
    id: number;
    dueTime: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    vehicle?: {
        plate: string;
        brand?: string;
        model?: string;
        driver?: { name: string };
    };
    route?: {
        name: string;
        description?: string;
        color?: string;
        ringType?: {
            name: string;
            color?: string;
        };
        stops?: { stop: { name: string }; sequence: number }[];
    };
}

interface DashboardStats {
    todayJobCount: number;
    totalRoutes: number;
    totalVehicles: number;
    activeVehicles: number;
    upcomingJobs: UpcomingJob[];
}

function computeStatus(job: UpcomingJob): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' {
    if (job.status === 'CANCELLED') return 'CANCELLED';
    const now = Date.now();
    const due = new Date(job.dueTime).getTime();
    if (due < now - 30 * 60 * 1000) return 'COMPLETED';
    if (due <= now + 10 * 60 * 1000) return 'IN_PROGRESS';
    return 'PENDING';
}

function StatusBadge({ status }: { status: ReturnType<typeof computeStatus> }) {
    if (status === 'IN_PROGRESS') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-medium rounded-full px-3">Devam Ediyor</Badge>;
    if (status === 'COMPLETED') return <Badge variant="outline" className="text-slate-500 border-slate-200 font-medium rounded-full px-3">Tamamlandı</Badge>;
    if (status === 'CANCELLED') return <Badge variant="outline" className="text-red-500 border-red-200 font-medium rounded-full px-3">İptal</Badge>;
    return <Badge variant="secondary" className="font-medium rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3">Bekliyor</Badge>;
}

function JobDetailModal({ job, open, onClose }: { job: UpcomingJob | null; open: boolean; onClose: () => void }) {
    if (!job) return null;
    const status = computeStatus(job);
    const dueMs = new Date(job.dueTime).getTime();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: job.route?.color || job.route?.ringType?.color || '#6366f1' }} />
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold text-slate-800">Sefer Detayı</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Durum + Zaman */}
                        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-700">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="font-bold text-lg">{format(dueMs, 'HH:mm', { locale: tr })}</span>
                                <span className="text-sm text-slate-400">{format(dueMs, 'dd MMM yyyy', { locale: tr })}</span>
                            </div>
                            <StatusBadge status={status} />
                        </div>

                        {/* Araç */}
                        <div className="flex items-start gap-3 px-1">
                            <Bus className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                            <div>
                                <div className="text-xs text-slate-400 font-medium mb-0.5">Araç</div>
                                <div className="font-semibold text-slate-800 font-mono tracking-wider">{job.vehicle?.plate ?? '—'}</div>
                                {(job.vehicle?.brand || job.vehicle?.model) && (
                                    <div className="text-sm text-slate-500">{[job.vehicle.brand, job.vehicle.model].filter(Boolean).join(' ')}</div>
                                )}
                                {job.vehicle?.driver && (
                                    <div className="text-sm text-slate-500 mt-0.5">Sürücü: {job.vehicle.driver.name}</div>
                                )}
                            </div>
                        </div>

                        {/* Güzergah */}
                        <div className="flex items-start gap-3 px-1">
                            <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                            <div>
                                <div className="text-xs text-slate-400 font-medium mb-0.5">Güzergah</div>
                                <div className="font-semibold text-slate-800">{job.route?.name ?? '—'}</div>
                                {job.route?.description && (
                                    <div className="text-sm text-slate-500">{job.route.description}</div>
                                )}
                            </div>
                        </div>

                        {/* Ring Tipi */}
                        <div className="flex items-start gap-3 px-1">
                            <Tag className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                            <div>
                                <div className="text-xs text-slate-400 font-medium mb-0.5">Ring Tipi</div>
                                <div className="flex items-center gap-2">
                                    {job.route?.ringType?.color && (
                                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: job.route.ringType.color }} />
                                    )}
                                    <span className="font-semibold text-slate-800">{job.route?.ringType?.name ?? '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Duraklar */}
                        {job.route?.stops && job.route.stops.length > 0 && (
                            <div className="px-1">
                                <div className="text-xs text-slate-400 font-medium mb-2">Duraklar ({job.route.stops.length})</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.route.stops
                                        .sort((a, b) => a.sequence - b.sequence)
                                        .map((rs, i) => (
                                            <span key={i} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-medium">
                                                {rs.stop.name}
                                            </span>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardPage() {
    const [selectedJob, setSelectedJob] = useState<UpcomingJob | null>(null);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
        refetchInterval: 60_000,
    });

    const statCards = [
        { title: 'Bugünkü Seferler', value: stats?.todayJobCount, icon: Activity, trend: 'Bugün planlanmış' },
        { title: 'Toplam Güzergah', value: stats?.totalRoutes, icon: RouteIcon, trend: 'Aktif kullanımda' },
        { title: 'Toplam Araç', value: stats?.totalVehicles, icon: CarFront, trend: 'Filo kapasitesi' },
        { title: 'Aktif Araçlar', value: stats?.activeVehicles, icon: CheckCircle2, trend: 'Şu an görevde' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm">
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
                                <span className="text-sm font-semibold text-slate-600">{card.title}</span>
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            {isLoading ? (
                                <Skeleton className="h-10 w-20" />
                            ) : (
                                <div>
                                    <div className="text-4xl font-bold text-primary mb-1 tracking-tight">{card.value ?? 0}</div>
                                    <div className="text-xs font-medium text-slate-400">{card.trend}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Yaklaşan Seferler Tablosu */}
            <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50">
                    <h3 className="text-lg font-bold text-primary">Yaklaşan Seferler</h3>
                </div>

                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-3/4 rounded-xl" />
                    </div>
                ) : !stats?.upcomingJobs || stats.upcomingJobs.length === 0 ? (
                    <div className="p-16 flex flex-col items-center text-slate-400">
                        <span className="text-sm font-medium">Hiç yaklaşan sefer bulunamadı.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto p-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none rounded-xl">
                                    <TableHead className="font-semibold text-xs text-slate-500 px-4 py-4 rounded-l-xl">Kalkış Vakti</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500">Araç</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500">Güzergah</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500">Ring Tipi</TableHead>
                                    <TableHead className="font-semibold text-xs text-slate-500 text-right px-4 rounded-r-xl">Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.upcomingJobs.map((job) => {
                                    const status = computeStatus(job);
                                    return (
                                        <TableRow
                                            key={job.id}
                                            className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer"
                                            onClick={() => setSelectedJob(job)}
                                        >
                                            <TableCell className="font-medium whitespace-nowrap px-4 py-5">
                                                <div className="text-slate-900 font-semibold">{format(new Date(job.dueTime).getTime(), 'HH:mm', { locale: tr })}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{format(new Date(job.dueTime).getTime(), 'dd MMM yyyy', { locale: tr })}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-900 font-mono tracking-wider">{job.vehicle?.plate}</div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-600">{job.route?.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    {job.route?.ringType?.color && (
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: job.route.ringType.color }} />
                                                    )}
                                                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-medium rounded-full px-3">
                                                        {job.route?.ringType?.name}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-4">
                                                <StatusBadge status={status} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <JobDetailModal
                job={selectedJob}
                open={!!selectedJob}
                onClose={() => setSelectedJob(null)}
            />
        </div>
    );
}
