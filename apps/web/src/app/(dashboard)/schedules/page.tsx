'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    Plus,
    LayoutGrid,
    ChevronLeft,
    Clock,
    Loader2,
    Edit3
} from 'lucide-react';
import { toast } from 'sonner';

import { getJobs, createJob, updateJob, deleteJob, Job } from '@/lib/jobs';
import { getRoutes, Route } from '@/lib/routes';
import { getVehicles, Vehicle } from '@/lib/devices';
import { getRingTypes, RingType } from '@/lib/ring-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// V3 Bileşenleri
import CalendarView from '@/components/schedules/CalendarView';
import SchedulerView from '@/components/schedules/SchedulerView';
import JobsForm from '@/components/schedules/JobsForm';

export default function SchedulesPage() {
    const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    // Veri state'leri
    const [jobs, setJobs] = useState<Job[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [ringTypes, setRingTypes] = useState<RingType[]>([]);

    // Modal state'leri
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newJobTime, setNewJobTime] = useState<string>('08:00');
    const [newJobRouteId, setNewJobRouteId] = useState<string>('');
    const [newJobVehicleId, setNewJobVehicleId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    const [isJobsFormOpen, setIsJobsFormOpen] = useState(false);
    const [initialEditingJobId, setInitialEditingJobId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (viewMode !== 'day') return;
        try {
            const [jobsRes, routesRes, vehiclesRes] = await Promise.all([
                getJobs(1, 100, { date: selectedDate }),
                getRoutes(1, 100),
                getVehicles(1, 100)
            ]);
            setJobs(jobsRes.data);
            setRoutes(routesRes.routes);
            setVehicles(vehiclesRes.vehicles);
        } catch (error) {
            console.error('Veri çekme hatası:', error);
        }
    }, [viewMode, selectedDate]);

    const fetchInitialData = async () => {
        const [routesRes, vehiclesRes, ringsRes] = await Promise.all([
            getRoutes(1, 100),
            getVehicles(1, 100),
            getRingTypes()
        ]);
        setRoutes(routesRes.routes);
        setVehicles(vehiclesRes.vehicles);
        setRingTypes(ringsRes);
    }

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedDate, viewMode]);

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setViewMode('day');
    };

    const handleSlotClick = (time: string) => {
        setNewJobTime(time);
        setIsAddModalOpen(true);
    };

    const handleEditJob = (job: Job) => {
        setInitialEditingJobId(job.id);
        setIsJobsFormOpen(true);
    };

    const handleEventDrop = async (job: Job, newStartTime: Date) => {
        try {
            await updateJob(job.id, {
                dueTime: newStartTime.getTime()
            });
            fetchData();
            toast.success('Sefer saati güncellendi');
        } catch {
            toast.error('Sefer saati güncellenemedi');
        }
    };

    const handleCreateJob = async () => {
        if (!newJobRouteId || !newJobVehicleId || !newJobTime) {
            alert('Lütfen tüm alanları doldurun!');
            return;
        }

        setIsSaving(true);
        try {
            const [hours, minutes] = newJobTime.split(':');
            const jobDate = parseISO(selectedDate);
            jobDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            await createJob({
                routeId: parseInt(newJobRouteId),
                vehicleId: newJobVehicleId,
                dueTime: jobDate.getTime(),
                status: 1,
                type: 1
            });

            setIsAddModalOpen(false);
            fetchData();
        } catch (error: unknown) {
            toast.error((error as Error).message || 'Sefer oluşturulamadı!');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteJob = async (job: Job) => {
        if (!confirm(`${format(new Date(Number(job.dueTime)), 'HH:mm')} seferini iptal etmek istediğinize emin misiniz?`)) return;
        try {
            await deleteJob(job.id);
            fetchData();
            toast.success('Sefer silindi');
        } catch (error) {
            toast.error('Sefer silinemedi!');
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">

            {/* Üst Bar: Navigasyon ve Kontroller */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {viewMode === 'day' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('month')}
                            className="rounded-full bg-white shadow-sm border border-slate-200"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                            {viewMode === 'month' ? 'Sefer Planlama' : format(parseISO(selectedDate), 'd MMMM yyyy, EEEE', { locale: tr })}
                        </h1>
                        <p className="text-slate-500 text-xs mt-1">
                            {viewMode === 'month' ? 'Aylık yoğunluk ve genel program görünümü' : 'Günlük operasyon çizelgesi ve araç atamaları'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'month' ? 'default' : 'outline'}
                        onClick={() => setViewMode('month')}
                        size="sm"
                        className="rounded-lg h-9 font-semibold"
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" /> Aylık
                    </Button>
                    <Button
                        variant={viewMode === 'day' ? 'default' : 'outline'}
                        onClick={() => setViewMode('day')}
                        size="sm"
                        className="rounded-lg h-9 font-semibold"
                    >
                        <Clock className="h-4 w-4 mr-2" /> Günlük
                    </Button>
                    <div className="w-[1px] h-6 bg-slate-200 mx-2" />
                    {(viewMode === 'day') && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsJobsFormOpen(true)}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 shadow-sm border border-purple-200 h-9 font-bold"
                        >
                            <Edit3 className="h-4 w-4 mr-2" /> Seferleri Düzenle
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 shadow-md h-9"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Yeni Sefer
                    </Button>
                </div>
            </div>

            {/* Ana İçerik Alanı */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {viewMode === 'month' ? (
                    <CalendarView onDateSelect={handleDateSelect} />
                ) : (
                    <SchedulerView
                        date={selectedDate}
                        jobs={jobs}
                        onEventClick={handleEditJob}
                        onSlotClick={handleSlotClick}
                        onEventDrop={handleEventDrop}
                    />
                )}
            </div>

            {/* Yeni Sefer Ekleme Modalı */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-900">Yeni Sefer Ekle</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-1">
                            Seçilen Tarih: <span className="text-primary font-bold">{format(parseISO(selectedDate), 'd MMMM yyyy', { locale: tr })}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="time" className="text-slate-600 font-bold text-xs uppercase tracking-wider">Kalkış Saati</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="time"
                                    id="time"
                                    value={newJobTime}
                                    onChange={(e) => setNewJobTime(e.target.value)}
                                    className="pl-10 h-11 border-slate-200 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Hat (Line)</Label>
                            <Select onValueChange={setNewJobRouteId}>
                                <SelectTrigger className="h-11 border-slate-200">
                                    <SelectValue placeholder="Bir hat seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map(r => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color || '#3b82f6' }} />
                                                <span className="font-semibold">{r.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Araç (Vehicle)</Label>
                            <Select onValueChange={setNewJobVehicleId}>
                                <SelectTrigger className="h-11 border-slate-200">
                                    <SelectValue placeholder="Bir araç seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{v.plate}</span>
                                                <span className="text-[10px] text-slate-400 leading-none">{v.brand} {v.model}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 mt-0">
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="font-bold text-slate-500">İptal</Button>
                        <Button
                            onClick={handleCreateJob}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90 px-8 font-bold"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Kaydet ve Bitir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <JobsForm
                open={isJobsFormOpen}
                onOpenChange={(open) => {
                    setIsJobsFormOpen(open);
                    if (!open) setInitialEditingJobId(null);
                }}
                date={selectedDate}
                jobs={jobs}
                routes={routes}
                vehicles={vehicles}
                ringTypes={ringTypes}
                onUpdate={fetchData}
                initialEditingJobId={initialEditingJobId}
            />
        </div>
    );
}
