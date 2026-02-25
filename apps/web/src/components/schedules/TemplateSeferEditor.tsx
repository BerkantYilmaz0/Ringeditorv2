'use client';

import React, { useState, useEffect } from 'react';
import {
    Trash2,
    Search,
    Loader2,
    Clock,
    Bus,
    MapPin,
    CalendarPlus,
    ChevronDown,
    ChevronUp,
    Check,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import {
    getTemplateJobs,
    createTemplateJob,
    updateTemplateJob,
    deleteTemplateJob,
    bulkDeleteTemplateJobs,
    Template,
    TemplateJob
} from '@/lib/templates';
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
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
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
import BulkDialog from './BulkDialog';

interface TemplateSeferEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: Template;
    onUpdate: () => void;
}

export default function TemplateSeferEditor({ open, onOpenChange, template, onUpdate }: TemplateSeferEditorProps) {
    const [templateJobs, setTemplateJobs] = useState<TemplateJob[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [ringTypes, setRingTypes] = useState<RingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<number[]>([]);

    // Dialog states for deletion overrides (bypass browser native confirm block)
    const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    const toggleGroup = (groupId: number) => {
        setCollapsedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    // Bulk Dialog State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [selectedBulkJob, setSelectedBulkJob] = useState<TemplateJob | null>(null);

    // Form state (Add Template Job)
    const [newTime, setNewTime] = useState('');
    const [newRingTypeId, setNewRingTypeId] = useState<string>('');
    const [newRouteId, setNewRouteId] = useState<string>('');
    const [newVehicleId, setNewVehicleId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Form state (Edit Template Job)
    const [editingJobId, setEditingJobId] = useState<number | null>(null);
    const [editTime, setEditTime] = useState('');
    const [editRingTypeId, setEditRingTypeId] = useState<string>('');
    const [editRouteId, setEditRouteId] = useState<string>('');
    const [editVehicleId, setEditVehicleId] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsData, routesRes, vehiclesRes, ringRes] = await Promise.all([
                getTemplateJobs(template.id),
                getRoutes(1, 100),
                getVehicles(1, 100),
                getRingTypes()
            ]);
            setTemplateJobs(jobsData);
            setRoutes(routesRes.routes);
            setVehicles(vehiclesRes.vehicles);
            setRingTypes(ringRes);
        } catch (error) {
            console.error('Veri çekme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, template.id]);

    const handleAddJob = async () => {
        if (!newTime || !newRingTypeId || !newRouteId) {
            toast.error('Gerekli alanlar eksik', {
                description: 'Lütfen en az Saat, Ring Tipi ve Rota seçin.'
            });
            return;
        }

        const [h, m] = newTime.split(':');
        const dummyDate = new Date();
        dummyDate.setHours(parseInt(h), parseInt(m), 0, 0);
        const timestamp = dummyDate.getTime();

        // Çakışma Kontrolü
        const isDuplicate = templateJobs.some(job =>
            Number(job.dueTime) === timestamp &&
            job.ringTypeId === parseInt(newRingTypeId) &&
            job.routeId === parseInt(newRouteId) &&
            (job.vehicleId === (newVehicleId || undefined))
        );

        if (isDuplicate) {
            toast.error('Çakışan Sefer Tespit Edildi', {
                description: 'Aynı saat, rota ve araç bilgisine sahip bir sefer şablonda zaten mevcut. Lütfen farklı bilgiler girin.'
            });
            return;
        }

        setIsSaving(true);
        try {
            await createTemplateJob({
                templateId: template.id,
                dueTime: timestamp,
                ringTypeId: parseInt(newRingTypeId),
                routeId: parseInt(newRouteId),
                vehicleId: newVehicleId || undefined,
                status: 1
            });
            fetchData();
            onUpdate(); // Parent component uyarılır
            // Formu kısmen temizle (saati koru, rotayı temizle vb. kullanıcı akışına göre)
            setNewRouteId('');
            toast.success('Sefer şablona eklendi.');
        } catch (error) {
            toast.error('Ekleme Başarısız', {
                description: 'Sefer şablona eklenemedi.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartEdit = (job: TemplateJob) => {
        setEditingJobId(job.id);
        const jobDate = new Date(Number(job.dueTime));
        setEditTime(format(jobDate, 'HH:mm'));
        setEditRingTypeId(job.ringTypeId.toString());
        setEditRouteId(job.routeId.toString());
        setEditVehicleId(job.vehicleId || "null");
    };

    const handleCancelEdit = () => {
        setEditingJobId(null);
    };

    const handleSaveEdit = async () => {
        if (!editingJobId) return;

        const [h, m] = editTime.split(':');
        const dummyDate = new Date();
        dummyDate.setHours(parseInt(h), parseInt(m), 0, 0);
        const timestamp = dummyDate.getTime();

        // Çakışma Kontrolü
        const isDuplicate = templateJobs.some(job =>
            job.id !== editingJobId &&
            Number(job.dueTime) === timestamp &&
            job.ringTypeId === parseInt(editRingTypeId) &&
            job.routeId === parseInt(editRouteId) &&
            (job.vehicleId === (editVehicleId === "null" ? undefined : editVehicleId))
        );

        if (isDuplicate) {
            toast.error('Değişiklik Uygulanamıyor', {
                description: 'Aynı özelliklere sahip başka bir sefer şablonda bulunduğundan değişiklikler uygulanamıyor.'
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateTemplateJob(editingJobId, {
                dueTime: timestamp,
                ringTypeId: parseInt(editRingTypeId),
                routeId: parseInt(editRouteId),
                vehicleId: editVehicleId === "null" ? undefined : editVehicleId
            });
            fetchData();
            onUpdate(); // Parent component uyarılır
            setEditingJobId(null);
            toast.success('Sefer güncellendi.');
        } catch (error) {
            toast.error('Güncelleme Başarısız', {
                description: 'Sefer güncellenemedi.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsSaving(true);
        try {
            console.log("Silme baslatildi", id);
            setNewVehicleId(''); // Opsiyonel 
            await deleteTemplateJob(id);
            await fetchData();
            onUpdate();
            toast.success('Sefer şablondan silindi.');
        } catch (error: unknown) {
            console.error("Silme hatasi:", error);
            toast.error('Hata', {
                description: 'Sefer silinirken bir hata oluştu.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkDelete = async () => {
        setIsSaving(true);
        const count = selectedIds.length;

        toast.promise(
            bulkDeleteTemplateJobs(template.id, selectedIds).then(async () => {
                setSelectedIds([]);
                await fetchData();
                onUpdate();
            }),
            {
                loading: `${count} sefer siliniyor, lütfen bekleyin...`,
                success: `${count} sefer başarıyla silindi.`,
                error: 'Toplu silme sırasında bir hata oluştu.',
                finally: () => setIsSaving(false)
            }
        );
    };

    const groupedJobs = ringTypes.map(rt => ({
        ...rt,
        jobs: templateJobs.filter(tj => tj.ringTypeId === rt.id &&
            (tj.route?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tj.vehicle?.plate.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    })).filter(group => group.jobs.length > 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl md:max-w-6xl w-[120vw] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                {/* Header Bölümü */}
                <DialogHeader className="p-6 bg-white border-b border-slate-100 flex-shrink-0">
                    <div className="flex justify-between items-center pr-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Seferleri Düzenle</DialogTitle>
                            <DialogDescription className="sr-only">Şablon için sefer düzenleme paneli ve takvimi</DialogDescription>
                        </div>
                        <Badge variant="outline" className="text-slate-500 font-mono">Şablon: {template.name}</Badge>
                    </div>

                    {/* Hızlı Ekleme Barı*/}
                    <div className="grid grid-cols-12 gap-3 mt-6 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Saat *</Label>
                            <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="h-10 bg-white" />
                        </div>
                        <div className="col-span-3 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Type *</Label>
                            <Select onValueChange={setNewRingTypeId}>
                                <SelectTrigger className="h-10 bg-white">
                                    <SelectValue placeholder="Seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ringTypes.map(rt => (<SelectItem key={rt.id} value={rt.id.toString()}>{rt.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Rota *</Label>
                            <Select onValueChange={setNewRouteId} value={newRouteId}>
                                <SelectTrigger className="h-10 bg-white">
                                    <SelectValue placeholder="Seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.filter(r => !newRingTypeId || r.ringTypeId === parseInt(newRingTypeId)).map(r => (
                                        <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Plaka</Label>
                            <Select onValueChange={setNewVehicleId}>
                                <SelectTrigger className="h-10 bg-white">
                                    <SelectValue placeholder="Otomatik" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">Otomatik (Boş)</SelectItem>
                                    {vehicles.map(v => (<SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-1">
                            <Button onClick={handleAddJob} disabled={isSaving} className="w-full h-10 bg-blue-600 hover:bg-blue-700 shadow-md">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Ekle</span>}
                            </Button>
                        </div>
                    </div>

                    {/* Arama ve Toplu İşlemler */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Sefer ara (saat / plaka)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-slate-200"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedIds.length === templateJobs.length && templateJobs.length > 0}
                                    onCheckedChange={(checked: boolean) => {
                                        setSelectedIds(checked ? templateJobs.map(j => j.id) : []);
                                    }}
                                />
                                <Label htmlFor="select-all" className="text-xs font-semibold text-slate-500">Tümünü Seç</Label>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={selectedIds.length === 0 || isSaving}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setBulkDeleteConfirmOpen(true);
                                }}
                                className="text-red-500 border-red-100 hover:bg-red-50 disabled:opacity-30 h-9 relative z-20"
                            >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />} Seçilenleri Sil ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Sefer Listesi */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <div className="space-y-4">
                        {groupedJobs.length === 0 && !loading ? (
                            <div className="text-center py-20 text-slate-400 italic">Şablonda henüz sefer bulunmamaktadır.</div>
                        ) : (
                            groupedJobs.map((group) => (
                                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-3 bg-slate-50/70 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-5 rounded-full shrink-0" style={{ backgroundColor: group.color || '#3b82f6' }} />
                                            <h3 className="font-bold text-slate-800 text-sm capitalize">{group.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary" className="bg-slate-200/50 text-[10px] font-bold text-slate-600 px-2 py-0.5 border-none">
                                                {group.jobs.length} Sefer
                                            </Badge>
                                            {collapsedGroups.includes(group.id) ? (
                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                            ) : (
                                                <ChevronUp className="h-4 w-4 text-slate-400" />
                                            )}
                                        </div>
                                    </div>

                                    {!collapsedGroups.includes(group.id) && (
                                        <div className="flex flex-col">
                                            {/* Sütun Başlıkları */}
                                            <div className="flex items-center p-2 px-3 bg-slate-50/50 border-b border-slate-100/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <div className="w-10"></div>
                                                <div className="w-24 pl-1">Saat</div>
                                                <div className="flex-15">Rota</div>
                                                <div className="w-32">Araç Plakası</div>
                                                <div className="w-20 text-right pr-2">İşlemler</div>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {group.jobs.map((job) => {
                                                    const isEditing = editingJobId === job.id;

                                                    if (isEditing) {
                                                        return (
                                                            <div key={job.id} className="grid grid-cols-12 gap-3 p-3 bg-blue-50/30 items-center">
                                                                <div className="col-span-2">
                                                                    <Input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="h-9 font-mono" />
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <Select value={editRingTypeId} onValueChange={(val) => {
                                                                        setEditRingTypeId(val);
                                                                        setEditRouteId(''); // Rota seçimini sıfırla
                                                                    }}>
                                                                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Ring Seçin" /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {ringTypes.map(rt => <SelectItem key={rt.id} value={rt.id.toString()}>{rt.name}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <Select value={editRouteId} onValueChange={setEditRouteId}>
                                                                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Rota Seçin" /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {routes.filter(r => r.ringTypeId === parseInt(editRingTypeId)).map(r => (
                                                                                <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <Select value={editVehicleId} onValueChange={setEditVehicleId}>
                                                                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Araç Seçin" /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="null">Otomatik (Boş)</SelectItem>
                                                                            {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="col-span-1 flex items-center justify-end gap-1">
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleSaveEdit} disabled={isSaving}>
                                                                        {isSaving && editingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
                                                                // Eğer tıklanan yer checkbox, button veya içindeki bir ikonsa row selection'a (edit'e) girme.
                                                                if (!target.closest('button') && !target.closest('.checkbox-container') && !isSaving) {
                                                                    handleStartEdit(job);
                                                                }
                                                            }}
                                                            className={`flex items-center p-3 hover:bg-slate-50 cursor-pointer transition-colors group ${isSaving ? 'opacity-60' : ''}`}
                                                        >
                                                            <div className="w-10 flex justify-center checkbox-container" onClick={e => e.stopPropagation()}>
                                                                <Checkbox
                                                                    checked={selectedIds.includes(job.id)}
                                                                    disabled={isSaving}
                                                                    onCheckedChange={(checked: boolean) => {
                                                                        setSelectedIds(prev => checked ? [...prev, job.id] : prev.filter(id => id !== job.id));
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="w-24 font-mono font-bold text-slate-600 flex items-center gap-1.5">
                                                                <Clock className="h-3 w-3 opacity-30" />
                                                                {format(new Date(Number(job.dueTime)), 'HH:mm')}
                                                            </div>
                                                            <div className="flex-1 flex items-center gap-2">
                                                                <MapPin className="h-3.5 w-3.5 text-slate-300" />
                                                                <span className="text-sm font-semibold text-slate-700">{job.route?.name}</span>
                                                            </div>
                                                            <div className="w-32 flex items-center gap-2">
                                                                <Bus className="h-3.5 w-3.5 text-slate-300" />
                                                                <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                                                                    {job.vehicle?.plate || <span className="text-slate-300 italic">Otomatik</span>}
                                                                </span>
                                                            </div>
                                                            <div className="w-20 flex justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title={!job.id ? "Önce bu seferi kaydedin" : "Birden Fazla Ekle"}
                                                                    disabled={!job.id || isSaving}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setSelectedBulkJob(job);
                                                                        setIsBulkDialogOpen(true);
                                                                    }}
                                                                    className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors mr-1 z-10 relative"
                                                                >
                                                                    <CalendarPlus className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setSingleDeleteId(job.id);
                                                                    }}
                                                                    disabled={isSaving}
                                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors z-20 relative"
                                                                >
                                                                    {isSaving && editingJobId === null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-slate-100 flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold text-slate-500">Kapat</Button>
                    <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-md">Kaydet Ve Bitir</Button>
                </DialogFooter>
            </DialogContent>
            {/* Toplu Ekleme Bulk Dialog */}
            <BulkDialog
                open={isBulkDialogOpen}
                onOpenChange={setIsBulkDialogOpen}
                baseJob={selectedBulkJob}
                existingJobs={templateJobs}
                onSaved={fetchData}
            />

            {/* Single Delete Confirm */}
            <AlertDialog open={singleDeleteId !== null} onOpenChange={(open) => !open && setSingleDeleteId(null)}>
                <AlertDialogContent className="z-[200]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Seferi Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu seferi şablondan silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                if (singleDeleteId !== null) handleDelete(singleDeleteId);
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
