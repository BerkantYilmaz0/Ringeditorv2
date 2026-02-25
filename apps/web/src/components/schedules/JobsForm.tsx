'use client';

import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Search,
    Trash2,
    Check,
    X,
    Loader2,
    Clock,
    Bus,
    MapPin,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, parseISO } from 'date-fns';
import { Job, updateJob, deleteJob, bulkDeleteJobs } from '@/lib/jobs';
import { Route } from '@/lib/routes';
import { Vehicle } from '@/lib/devices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RingType } from '@/lib/ring-types';

interface JobsFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: string;
    jobs: Job[];
    routes: Route[];
    vehicles: Vehicle[];
    ringTypes: RingType[];
    onUpdate: () => void;
    initialEditingJobId?: number | null;
}

export default function JobsForm({
    open,
    onOpenChange,
    date,
    jobs,
    routes,
    vehicles,
    ringTypes,
    onUpdate,
    initialEditingJobId
}: JobsFormProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<number[]>([]);
    const [editingJobId, setEditingJobId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete confirm dialogue states
    const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    const toggleGroup = (groupId: number) => {
        setCollapsedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    // Inline edit state
    const [editTime, setEditTime] = useState('');
    const [editRingTypeId, setEditRingTypeId] = useState<string>('');
    const [editRouteId, setEditRouteId] = useState<string>('');
    const [editVehicleId, setEditVehicleId] = useState<string>('');

    // Harici edit tetikleyici
    React.useEffect(() => {
        if (open && initialEditingJobId) {
            const job = jobs.find(j => j.id === initialEditingJobId);
            if (job) {
                handleStartEdit(job);
                // Grubu aç (eğer kapalıysa)
                const rtId = job.route?.ringType?.id || 0;
                setCollapsedGroups(prev => prev.filter(id => id !== rtId));
            }
        } else if (!open) {
            setEditingJobId(null);
        }
    }, [open, initialEditingJobId, jobs]);

    // Sadece gelecek seferleri filtrele (Geçmişleri gizle, eğer bugünün tarihindeyse)
    // Aslında Planlar-Sayfasi.md'ye göre "Yalnızca seçilen güne ait ve gelecek saatlerdeki seferler".
    const filteredFutureJobs = useMemo(() => {
        const now = new Date();
        return jobs.filter(job => {
            const jobDate = new Date(Number(job.dueTime));
            // Seçilen güne ait mi? Zaten parent component filters date=... 
            // Eğer selectedDate = bugün ise geçmiş saatleri gizle
            return isAfter(jobDate, now) || format(now, 'yyyy-MM-dd') !== date;
        });
    }, [jobs, date]);

    // Arama filtrelemesi
    const searchedJobs = useMemo(() => {
        if (!searchTerm) return filteredFutureJobs;
        const term = searchTerm.toLowerCase();
        return filteredFutureJobs.filter(job => {
            const timeStr = format(new Date(Number(job.dueTime)), 'HH:mm');
            const ringName = job.route?.ringType?.name?.toLowerCase() || '';
            const plate = job.vehicle?.plate?.toLowerCase() || '';
            return timeStr.includes(term) || ringName.includes(term) || plate.includes(term);
        });
    }, [filteredFutureJobs, searchTerm]);

    // Grubu ring tipine göre yap (route.ringType üzerinden)
    const groupedJobs = useMemo(() => {
        const groups: Record<number, { ringType: RingType, jobs: Job[] }> = {};
        searchedJobs.forEach(job => {
            const rt = job.route?.ringType;
            const rtId = rt?.id || 0; // 0 for unknown
            if (!groups[rtId]) {
                groups[rtId] = {
                    ringType: rt || ({ id: 0, name: 'Tanımsız', color: '#ccc' } as unknown as RingType),
                    jobs: []
                };
            }
            groups[rtId].jobs.push(job);
        });

        // İsme göre sırala
        return Object.values(groups).sort((a, b) => a.ringType.name.localeCompare(b.ringType.name));
    }, [searchedJobs]);

    const handleSelectAllInGroup = (groupId: number, checked: boolean) => {
        const groupJobs = groupedJobs.find(g => g.ringType.id === groupId)?.jobs || [];
        const groupJobIds = groupJobs.map(j => j.id);

        if (checked) {
            setSelectedIds(prev => Array.from(new Set([...prev, ...groupJobIds])));
        } else {
            setSelectedIds(prev => prev.filter(id => !groupJobIds.includes(id)));
        }
    };

    const handleStartEdit = (job: Job) => {
        setEditingJobId(job.id);
        setEditTime(format(new Date(Number(job.dueTime)), 'HH:mm'));
        setEditRingTypeId(job.route?.ringTypeId?.toString() || '');
        setEditRouteId(job.routeId?.toString() || '');
        setEditVehicleId(job.vehicleId);
    };

    const handleCancelEdit = () => {
        setEditingJobId(null);
    };

    const handleSaveEdit = async () => {
        if (!editingJobId) return;
        if (!editTime || !editRouteId) {
            toast.error('Gerekli Alanlar Eksik', {
                description: 'Saat ve ring tipi (rota) alanları zorunludur.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const [h, m] = editTime.split(':');
            const jobDate = parseISO(date);
            jobDate.setHours(parseInt(h), parseInt(m), 0, 0);

            // Çakışma Kontrolü
            const isDuplicate = jobs.some(job =>
                job.id !== editingJobId &&
                Number(job.dueTime) === jobDate.getTime() &&
                job.routeId === parseInt(editRouteId) &&
                (job.vehicleId === (editVehicleId === "null" || editVehicleId === "" ? undefined : editVehicleId))
            );

            if (isDuplicate) {
                toast.error('Çakışan Sefer Tespit Edildi', {
                    description: 'Aynı saat, rota ve araç bilgisine sahip başka bir sefer halihazırda var. Lütfen farklı bilgiler girin.',
                });
                setIsSaving(false);
                return;
            }

            await updateJob(editingJobId, {
                dueTime: jobDate.getTime(),
                routeId: parseInt(editRouteId),
                vehicleId: editVehicleId === "null" || editVehicleId === "" ? undefined : editVehicleId,
                type: 1
            });

            // UI refresh
            onUpdate();
            setEditingJobId(null);
            toast.success('Sefer Güncellendi');
        } catch (error: unknown) {
            console.error(error);
            toast.error('Güncelleme Başarısız', {
                description: (error as Error).message || 'Güncelleme sırasında hata oluştu.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSingleDelete = async (id: number) => {
        try {
            await deleteJob(id);
            setSelectedIds(prev => prev.filter(sId => sId !== id));
            onUpdate();
            toast.success('Sefer başarıyla silindi.');
        } catch (error: unknown) {
            toast.error('Silme İşlemi Başarısız', {
                description: 'Silme işlemi sırasında bir hata meydana geldi.'
            });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        setIsSaving(true);
        const count = selectedIds.length;

        toast.promise(
            bulkDeleteJobs(selectedIds).then(() => {
                setSelectedIds([]);
                onUpdate();
            }),
            {
                loading: `${count} sefer siliniyor, lütfen bekleyin...`,
                success: `${count} sefer başarıyla silindi.`,
                error: 'Toplu silme işlemi sırasında bir hata oluştu.',
                finally: () => setIsSaving(false)
            }
        );
    };

    // Edit modunda Ring değişirse otomatik ilk rotayı seç
    const onEditRingChange = (val: string) => {
        setEditRingTypeId(val);
        const firstRoute = routes.find(r => r.ringTypeId === parseInt(val));
        if (firstRoute) {
            setEditRouteId(firstRoute.id.toString());
        } else {
            setEditRouteId('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl md:max-w-12xl w-[120vw] h-[85vh] flex flex-col p-0 border-none shadow-2xl">
                {/* Header */}
                <DialogHeader className="p-6 bg-white border-b border-slate-100 flex-shrink-0">
                    <div className="flex justify-between items-center pr-8">
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-800">Seferleri Düzenle</DialogTitle>
                            <DialogDescription className="sr-only">Seçili günün tamamını kapsayan listeleme ekranı</DialogDescription>
                        </div>
                        <Badge variant="outline" className="font-mono text-slate-500">{format(parseISO(date), 'dd.MM.yyyy')}</Badge>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Sefer ara (saat / ring / plaka)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 border-slate-200"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setBulkDeleteConfirmOpen(true)}
                                disabled={selectedIds.length === 0 || isSaving}
                                className="text-red-500 border-red-100 hover:bg-red-50 disabled:opacity-40"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Seçilen Seferleri Sil ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {groupedJobs.length === 0 ? (
                        <div className="text-center py-10 bg-blue-50/50 rounded-xl border border-blue-100">
                            <p className="text-blue-800 font-medium text-sm">Henüz kayıt yok veya arama sonucu boş.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groupedJobs.map(group => {
                                const groupJobIds = group.jobs.map(j => j.id);
                                const isAllSelected = groupJobIds.every(id => selectedIds.includes(id));
                                const isSomeSelected = groupJobIds.some(id => selectedIds.includes(id));

                                return (
                                    <div key={group.ringType.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div
                                            className="flex items-center justify-between p-3 bg-slate-50/70 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                            onClick={() => toggleGroup(group.ringType.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={isAllSelected ? true : (isSomeSelected ? 'indeterminate' : false)}
                                                        onCheckedChange={(checked) => handleSelectAllInGroup(group.ringType.id, !!checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-5 rounded-full shrink-0" style={{ backgroundColor: group.ringType.color || '#ccc' }} />
                                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{group.ringType.name}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="bg-slate-200/50 font-bold text-[10px] text-slate-600 px-2 py-0.5 border-none">
                                                    {group.jobs.length} Sefer
                                                </Badge>
                                                {collapsedGroups.includes(group.ringType.id) ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                                )}
                                            </div>
                                        </div>

                                        {!collapsedGroups.includes(group.ringType.id) && (
                                            <div className="divide-y divide-slate-50">
                                                {group.jobs.map(job => {
                                                    const isEditing = editingJobId === job.id;
                                                    const isSelected = selectedIds.includes(job.id);

                                                    if (isEditing) {
                                                        return (
                                                            <div key={job.id} className="grid grid-cols-12 gap-3 p-3 bg-blue-50/30 items-center">
                                                                <div className="col-span-2">
                                                                    <Input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="h-9 font-mono" />
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <Select value={editRingTypeId} onValueChange={onEditRingChange}>
                                                                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Ring Seçin" /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {ringTypes.map(rt => <SelectItem key={rt.id} value={rt.id.toString()}>{rt.name}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <Input disabled value={routes.find(r => r.id.toString() === editRouteId)?.name || 'Rota Yok'} className="h-9 bg-slate-100 text-slate-500 font-semibold" />
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <Select value={editVehicleId} onValueChange={setEditVehicleId}>
                                                                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Araç Seçin" /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="col-span-1 flex items-center justify-end gap-1">
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleSaveEdit} disabled={isSaving}>
                                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:bg-slate-100" onClick={handleCancelEdit}>
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={job.id}
                                                            onClick={(e) => {
                                                                const target = e.target as HTMLElement;
                                                                // Eğer butona veya checkbox'a basılmadıysa satır click
                                                                if (!target.closest('button') && !target.closest('button[role="checkbox"]')) {
                                                                    handleStartEdit(job);
                                                                }
                                                            }}
                                                            className={`flex items-center p-3 hover:bg-slate-100 cursor-pointer transition-colors group ${isSelected ? 'bg-slate-50' : ''}`}
                                                        >
                                                            <div className="w-10 flex justify-center">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        setSelectedIds(prev => checked ? [...prev, job.id] : prev.filter(id => id !== job.id));
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="w-24 font-mono font-bold text-slate-700 flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                                {format(new Date(Number(job.dueTime)), 'HH:mm')}
                                                            </div>
                                                            <div className="w-48 flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.ringType.color || '#ccc' }} />
                                                                <span className="text-xs font-bold text-slate-600 truncate">{group.ringType.name}</span>
                                                            </div>
                                                            <div className="flex-1 flex items-center gap-2 px-2 text-slate-600">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                                                <span className="text-sm font-semibold truncate">{job.route?.name}</span>
                                                            </div>
                                                            <div className="w-32 flex items-center justify-start">
                                                                <Badge variant="secondary" className="font-mono text-[11px] font-bold tracking-wider px-2 border-slate-200">
                                                                    <Bus className="w-3 h-3 mr-1 text-slate-400" />
                                                                    {job.vehicle?.plate}
                                                                </Badge>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="w-16 flex justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => { e.stopPropagation(); setSingleDeleteId(job.id); }}
                                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>

            {/* Single Delete Confirm */}
            <AlertDialog open={singleDeleteId !== null} onOpenChange={(open) => !open && setSingleDeleteId(null)}>
                <AlertDialogContent className="z-[200]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Seferi Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu seferi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                if (singleDeleteId !== null) handleSingleDelete(singleDeleteId);
                                setSingleDeleteId(null);
                            }}
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirm */}
            <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
                <AlertDialogContent className="z-[200]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Toplu Silme</AlertDialogTitle>
                        <AlertDialogDescription>
                            Seçtiğiniz {selectedIds.length} sefer silinecek. Emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                handleBulkDelete();
                                setBulkDeleteConfirmOpen(false);
                            }}
                        >
                            Sil ({selectedIds.length})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
