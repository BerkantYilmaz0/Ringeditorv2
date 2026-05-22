'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, X, Trash2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import {
    getTemplateJobs,
    createTemplateJob,
    updateTemplateJob,
    deleteTemplateJob,
    updateTemplate,
    deleteTemplate,
    Template,
    TemplateJob
} from '@/lib/templates';
import { getAllRoutes, Route } from '@/lib/routes';
import { getVehicles, Vehicle } from '@/lib/devices';
import { getRingTypes, RingType } from '@/lib/ring-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import BulkDialog from './BulkDialog';

const DAYS = [
    { key: 'pzt', label: 'Pzt' },
    { key: 'sal', label: 'Sal' },
    { key: 'car', label: 'Çar' },
    { key: 'per', label: 'Per' },
    { key: 'cum', label: 'Cum' },
    { key: 'cmt', label: 'Cmt' },
    { key: 'paz', label: 'Paz' },
];

const DEFAULT_ACTIVE_DAYS = ['pzt', 'sal', 'car', 'per', 'cum'];

interface SlotRow {
    id?: number;
    time: string;
    routeId: string;
    vehicleId: string;
    isNew?: boolean;
    originalJob?: TemplateJob;
}

interface TemplateSeferEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: Template;
    onUpdate: () => void;
}

export default function TemplateSeferEditor({ open, onOpenChange, template, onUpdate }: TemplateSeferEditorProps) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [ringTypes, setRingTypes] = useState<RingType[]>([]);
    const [allJobs, setAllJobs] = useState<TemplateJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [name, setName] = useState(template.name);
    const [description, setDescription] = useState(template.description || '');
    const [activeDays, setActiveDays] = useState<string[]>(DEFAULT_ACTIVE_DAYS);
    const [slots, setSlots] = useState<SlotRow[]>([]);

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkJob, setBulkJob] = useState<TemplateJob | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsData, routesRes, vehiclesRes, ringRes] = await Promise.all([
                getTemplateJobs(template.id),
                getAllRoutes(),
                getVehicles(1, 100),
                getRingTypes()
            ]);
            setRoutes(routesRes);
            setVehicles(vehiclesRes.vehicles);
            setRingTypes(ringRes);
            setAllJobs(jobsData);

            const mapped: SlotRow[] = jobsData
                .sort((a, b) => a.dueTime - b.dueTime)
                .map(j => ({
                    id: j.id,
                    time: format(new Date(j.dueTime), 'HH:mm'),
                    routeId: j.routeId.toString(),
                    vehicleId: j.vehicleId || '',
                    originalJob: j,
                }));
            setSlots(mapped);
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setName(template.name);
            setDescription(template.description || '');
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, template.id]);

    const toggleDay = (key: string) => {
        setActiveDays(prev =>
            prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
        );
    };

    const addSlot = () => {
        const lastTime = slots[slots.length - 1]?.time;
        let nextTime = '08:00';
        if (lastTime) {
            const [h, m] = lastTime.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m + 30, 0, 0);
            nextTime = format(d, 'HH:mm');
        }
        setSlots(prev => [...prev, { time: nextTime, routeId: '', vehicleId: '', isNew: true }]);
    };

    const removeSlot = async (index: number) => {
        const slot = slots[index];
        if (slot.id) {
            try {
                await deleteTemplateJob(slot.id);
                onUpdate();
            } catch {
                toast.error('Slot silinemedi');
                return;
            }
        }
        setSlots(prev => prev.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, field: keyof SlotRow, value: string) => {
        setSlots(prev => prev.map((s, i) =>
            i === index ? { ...s, [field]: value, ...(field === 'routeId' ? { vehicleId: '' } : {}) } : s
        ));
    };

    const getRingTypeIdForRoute = (routeId: string): number | null => {
        const route = routes.find(r => r.id.toString() === routeId);
        return route?.ringTypeId ?? null;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateTemplate(template.id, {
                name: name.trim(),
                description: description.trim() || undefined,
            });

            for (const slot of slots) {
                if (!slot.routeId || !slot.time) continue;
                const [h, m] = slot.time.split(':');
                const d = new Date();
                d.setHours(parseInt(h), parseInt(m), 0, 0);
                const ts = d.getTime();
                const ringTypeId = getRingTypeIdForRoute(slot.routeId);
                if (!ringTypeId) continue;

                if (slot.isNew && !slot.id) {
                    await createTemplateJob({
                        templateId: template.id,
                        dueTime: ts,
                        ringTypeId,
                        routeId: parseInt(slot.routeId),
                        vehicleId: slot.vehicleId || undefined,
                        status: 'PENDING',
                    });
                } else if (slot.id) {
                    await updateTemplateJob(slot.id, {
                        dueTime: ts,
                        ringTypeId,
                        routeId: parseInt(slot.routeId),
                        vehicleId: slot.vehicleId || undefined,
                    });
                }
            }

            toast.success('Şablon kaydedildi');
            onUpdate();
            onOpenChange(false);
        } catch {
            toast.error('Kaydetme başarısız');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async () => {
        try {
            await deleteTemplate(template.id);
            toast.success('Şablon silindi');
            onUpdate();
            onOpenChange(false);
        } catch {
            toast.error('Şablon silinemedi');
        }
    };

    const getVehicleLabel = (v: Vehicle) =>
        v.driver?.name ? `${v.plate} · ${v.driver.name}` : v.plate;

    const routesByRing = ringTypes.map(rt => ({
        ring: rt,
        routes: routes.filter(r => r.ringTypeId === rt.id),
    })).filter(g => g.routes.length > 0);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {/* ↓↓ BOYUT BURADAN AYARLANIR ↓↓ */}
                <DialogContent className="sm:max-w-[900px] w-[88vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
                        <DialogTitle className="text-lg font-bold text-slate-800">Şablonu Düzenle</DialogTitle>
                        <DialogDescription className="text-sm text-slate-400">
                            Tekrar eden sefer planını şablon olarak kaydet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Name + Description — 2 kolon */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Şablon adı</Label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="örn. Hafta içi sabah"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Açıklama</Label>
                                <Input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Pzt-Cum sabah seferleri"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        {/* Active Days */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-600">Aktif günler</Label>
                            <div className="flex gap-1.5 flex-wrap">
                                {DAYS.map(d => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() => toggleDay(d.key)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeDays.includes(d.key)
                                            ? 'bg-[#0d9488] text-white'
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slot List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-slate-600">
                                    Sefer slotları ({slots.length})
                                </Label>
                                <button
                                    type="button"
                                    onClick={addSlot}
                                    className="text-xs text-[#0d9488] hover:text-[#0f766e] font-medium flex items-center gap-1"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Slot ekle
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin text-[#0d9488]" />
                                    </div>
                                ) : slots.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        Henüz slot eklenmemiş.{' '}
                                        <button onClick={addSlot} className="text-[#0d9488] hover:underline font-medium">
                                            + Slot ekle
                                        </button>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {slots.map((slot, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 group">
                                                <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0">{i + 1}.</span>

                                                {/* Time */}
                                                <input
                                                    type="time"
                                                    value={slot.time}
                                                    onChange={e => updateSlot(i, 'time', e.target.value)}
                                                    className="w-[98px] h-8 border border-slate-200 rounded-md px-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-white flex-shrink-0"
                                                />

                                                {/* Route — grouped by ring */}
                                                <select
                                                    value={slot.routeId}
                                                    onChange={e => updateSlot(i, 'routeId', e.target.value)}
                                                    className="flex-1 h-8 border border-slate-200 rounded-md px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-white min-w-0"
                                                >
                                                    <option value="">— Rota seçin —</option>
                                                    {routesByRing.map(group => (
                                                        <optgroup key={group.ring.id} label={group.ring.name}>
                                                            {group.routes.map(r => (
                                                                <option key={r.id} value={r.id.toString()}>{r.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>

                                                {/* Vehicle */}
                                                <select
                                                    value={slot.vehicleId}
                                                    onChange={e => updateSlot(i, 'vehicleId', e.target.value)}
                                                    className="w-[140px] h-8 border border-slate-200 rounded-md px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-white flex-shrink-0"
                                                >
                                                    <option value="">Otomatik</option>
                                                    {vehicles.map(v => (
                                                        <option key={v.id} value={v.id}>{getVehicleLabel(v)}</option>
                                                    ))}
                                                </select>

                                                {/* Bulk — only for saved slots */}
                                                {slot.originalJob ? (
                                                    <button
                                                        type="button"
                                                        title="Birden fazla sefer ekle"
                                                        onClick={() => { setBulkJob(slot.originalJob!); setBulkOpen(true); }}
                                                        className="p-1.5 rounded-md text-slate-300 hover:text-purple-600 hover:bg-purple-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <CalendarPlus className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <div className="w-7 flex-shrink-0" />
                                                )}

                                                {/* Remove */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSlot(i)}
                                                    className="p-1.5 rounded-md text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-white">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(true)}
                            className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 text-sm h-9"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Şablonu sil
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-9 text-sm">
                                Vazgeç
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !name.trim()}
                                className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-9 text-sm px-6"
                            >
                                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                Kaydet
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Dialog */}
            <BulkDialog
                open={bulkOpen}
                onOpenChange={setBulkOpen}
                baseJob={bulkJob}
                existingJobs={allJobs}
                onSaved={() => { fetchData(); onUpdate(); }}
            />

            {/* Delete Confirm */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{template.name}" kalıcı olarak silinecek. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleDeleteTemplate}
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
