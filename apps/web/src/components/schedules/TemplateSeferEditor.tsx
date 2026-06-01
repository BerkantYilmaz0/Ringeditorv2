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

    // ─── Akordeon Durumları ──────────────────────────────────────────────────
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const addSlotForRing = (ringId: number) => {
        // Bu ring tipine ait rotaları bul
        const ringRoutes = routes.filter(r => r.ringTypeId === ringId);
        const routeId = ringRoutes[0]?.id.toString() || '';

        const lastTime = slots[slots.length - 1]?.time;
        let nextTime = '08:00';
        if (lastTime) {
            const [h, m] = lastTime.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m + 30, 0, 0);
            nextTime = format(d, 'HH:mm');
        }

        setSlots(prev => [...prev, { time: nextTime, routeId, vehicleId: '', isNew: true }]);

        // Eklendiğinde akordeonu otomatik aç
        setOpenSections(prev => ({ ...prev, [ringId.toString()]: true }));
    };

    const getVehicleLabel = (v: Vehicle) =>
        v.driver?.name ? `${v.plate} · ${v.driver.name}` : v.plate;

    // ─── Gruplama Mantığı ──────────────────────────────────────────────────────

    // 1. Tanımlanmamış/Rotası Seçilmemiş Slotlar (Yeni eklenenler)
    const undefinedSlots = slots
        .map((s, index) => ({ slot: s, index }))
        .filter(item => !item.slot.routeId);

    // 2. Ring Tiplerine Göre Gruplanmış Slotlar
    const groupedSlots = ringTypes.map(rt => {
        const items = slots
            .map((s, index) => ({ slot: s, index }))
            .filter(item => {
                const rId = item.slot.routeId;
                if (!rId) return false;
                return getRingTypeIdForRoute(rId) === rt.id;
            });

        return {
            ring: rt,
            items
        };
    });

    // Varsayılan olarak içi dolu olan akordeonları açık tut
    useEffect(() => {
        if (slots.length > 0 && Object.keys(openSections).length === 0) {
            const initial: Record<string, boolean> = { undefined: true };
            ringTypes.forEach(rt => {
                const hasItems = slots.some(s => {
                    const rId = s.routeId;
                    return rId && getRingTypeIdForRoute(rId) === rt.id;
                });
                if (hasItems) {
                    initial[rt.id.toString()] = true;
                }
            });
            setOpenSections(initial);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slots.length, ringTypes.length]);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[950px] w-[90vw] max-h-[92vh] overflow-hidden flex flex-col p-0 border border-slate-100 shadow-xl rounded-xl">
                    <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0 bg-slate-50/50 border-b border-slate-100">
                        <DialogTitle className="text-lg font-bold text-slate-800">Şablonu Düzenle</DialogTitle>
                        <DialogDescription className="text-sm text-slate-400">
                            Tekrar eden sefer planını şablon olarak kaydet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-slate-50/30">
                        {/* Name + Description — 2 kolon */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Şablon adı</Label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="örn. Hafta içi sabah"
                                    className="h-10 text-sm border-slate-200 focus:border-[#0d9488] focus:ring-[#0d9488] rounded-lg transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Açıklama</Label>
                                <Input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Pzt-Cum sabah seferleri"
                                    className="h-10 text-sm border-slate-200 focus:border-[#0d9488] focus:ring-[#0d9488] rounded-lg transition-all"
                                />
                            </div>
                        </div>

                        {/* Active Days */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Aktif günler</Label>
                            <div className="flex gap-1.5 flex-wrap">
                                {DAYS.map(d => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() => toggleDay(d.key)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${activeDays.includes(d.key)
                                            ? 'bg-[#0d9488] text-white hover:bg-[#0f766e]'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slot List Container */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Sefer slotları ({slots.length})
                                </Label>
                                <button
                                    type="button"
                                    onClick={addSlot}
                                    className="text-xs text-[#0d9488] hover:text-[#0f766e] font-semibold flex items-center gap-1 bg-[#0d9488]/10 hover:bg-[#0d9488]/20 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Boş Slot Ekle
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#0d9488]" />
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-12 bg-white border border-slate-150 rounded-xl shadow-sm border-dashed">
                                    <div className="text-slate-400 text-sm mb-3">Henüz slot eklenmemiş.</div>
                                    <Button onClick={addSlot} className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold rounded-lg">
                                        + İlk Slotu Ekle
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* ────────── YENİ / TANIMLANMAMIŞ SLOTLAR ────────── */}
                                    {undefinedSlots.length > 0 && (
                                        <div className="bg-white border border-yellow-100 rounded-xl overflow-hidden shadow-sm">
                                            <div
                                                onClick={() => toggleSection('undefined')}
                                                className="flex items-center justify-between px-4 py-3 bg-yellow-50/50 border-b border-yellow-50 cursor-pointer select-none"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                                                    <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Rotalandırılmamış Seferler</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-bold">
                                                        {undefinedSlots.length} Sefer
                                                    </span>
                                                </div>
                                                <span className="text-xs text-yellow-700 font-bold">{openSections['undefined'] ? 'Gizle' : 'Göster'}</span>
                                            </div>

                                            {openSections['undefined'] && (
                                                <div className="divide-y divide-slate-100 p-2 space-y-1">
                                                    {undefinedSlots.map(({ slot, index }) => (
                                                        <div key={index} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50/50 rounded-lg group">
                                                            <span className="text-xs font-bold text-slate-300 w-6 text-right">{index + 1}.</span>
                                                            <input
                                                                type="time"
                                                                value={slot.time}
                                                                onChange={e => updateSlot(index, 'time', e.target.value)}
                                                                className="w-[98px] h-9 border border-slate-200 rounded-lg px-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white flex-shrink-0"
                                                            />
                                                            <select
                                                                value={slot.routeId}
                                                                onChange={e => updateSlot(index, 'routeId', e.target.value)}
                                                                className="flex-1 h-9 border border-slate-200 rounded-lg px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white min-w-0 font-medium"
                                                            >
                                                                <option value="">— Rota seçin (Gruba aktarılacak) —</option>
                                                                {ringTypes.map(rt => {
                                                                    const ringRoutes = routes.filter(r => r.ringTypeId === rt.id);
                                                                    if (ringRoutes.length === 0) return null;
                                                                    return (
                                                                        <optgroup key={rt.id} label={rt.name}>
                                                                            {ringRoutes.map(r => (
                                                                                <option key={r.id} value={r.id.toString()}>{r.name}</option>
                                                                            ))}
                                                                        </optgroup>
                                                                    );
                                                                })}
                                                            </select>
                                                            <select
                                                                value={slot.vehicleId}
                                                                onChange={e => updateSlot(index, 'vehicleId', e.target.value)}
                                                                className="w-[150px] h-9 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white flex-shrink-0 font-medium"
                                                            >
                                                                <option value="">Otomatik Araç</option>
                                                                {vehicles.map(v => (
                                                                    <option key={v.id} value={v.id}>{getVehicleLabel(v)}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSlot(index)}
                                                                className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ────────── RİNG TİPLERİNE GÖRE GRUPLANMIŞ AKORDEONLAR ────────── */}
                                    {groupedSlots.map(group => {
                                        const ringIdStr = group.ring.id.toString();
                                        const ringColor = group.ring.color || '#0d9488';

                                        return (
                                            <div
                                                key={group.ring.id}
                                                className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm transition-all"
                                                style={{ borderLeft: `4px solid ${ringColor}` }}
                                            >
                                                {/* Akordeon Başlığı */}
                                                <div
                                                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50/50 border-b border-slate-100"
                                                    onClick={() => toggleSection(ringIdStr)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className="w-3.5 h-3.5 rounded-full inline-block shadow-inner"
                                                            style={{ background: ringColor }}
                                                        />
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                            {group.ring.name}
                                                        </span>
                                                        <span
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                            style={{ background: `${ringColor}15`, color: ringColor }}
                                                        >
                                                            {group.items.length} Sefer
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => addSlotForRing(group.ring.id)}
                                                            className="text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-all flex items-center gap-1"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Sefer Ekle
                                                        </button>
                                                        <button
                                                            onClick={() => toggleSection(ringIdStr)}
                                                            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-1"
                                                        >
                                                            {openSections[ringIdStr] ? 'Gizle' : 'Göster'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Akordeon Gövdesi */}
                                                {openSections[ringIdStr] && (
                                                    <div className="divide-y divide-slate-100 p-2 space-y-1">
                                                        {group.items.length === 0 ? (
                                                            <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                                                Bu ring tipine ait henüz planlanmış sefer yok.
                                                            </div>
                                                        ) : (
                                                            group.items.map(({ slot, index }) => {
                                                                // Sadece bu Ring Tipine ait rotaları göster
                                                                const filteredRoutes = routes.filter(r => r.ringTypeId === group.ring.id);

                                                                return (
                                                                    <div key={index} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50/50 rounded-lg group">
                                                                        <span className="text-xs font-bold text-slate-300 w-6 text-right">{index + 1}.</span>

                                                                        {/* Time */}
                                                                        <input
                                                                            type="time"
                                                                            value={slot.time}
                                                                            onChange={e => updateSlot(index, 'time', e.target.value)}
                                                                            className="w-[98px] h-9 border border-slate-200 rounded-lg px-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white flex-shrink-0"
                                                                        />

                                                                        {/* Route — Filtered to current ring type */}
                                                                        <select
                                                                            value={slot.routeId}
                                                                            onChange={e => updateSlot(index, 'routeId', e.target.value)}
                                                                            className="flex-1 h-9 border border-slate-200 rounded-lg px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white min-w-0 font-medium"
                                                                        >
                                                                            <option value="">— Rota seçin —</option>
                                                                            {filteredRoutes.map(r => (
                                                                                <option key={r.id} value={r.id.toString()}>{r.name}</option>
                                                                            ))}
                                                                        </select>

                                                                        {/* Vehicle */}
                                                                        <select
                                                                            value={slot.vehicleId}
                                                                            onChange={e => updateSlot(index, 'vehicleId', e.target.value)}
                                                                            className="w-[150px] h-9 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white flex-shrink-0 font-medium"
                                                                        >
                                                                            <option value="">Otomatik Araç</option>
                                                                            {vehicles.map(v => (
                                                                                <option key={v.id} value={v.id}>{getVehicleLabel(v)}</option>
                                                                            ))}
                                                                        </select>

                                                                        {/* Bulk Action */}
                                                                        {slot.originalJob ? (
                                                                            <button
                                                                                type="button"
                                                                                title="Birden fazla sefer ekle"
                                                                                onClick={() => { setBulkJob(slot.originalJob!); setBulkOpen(true); }}
                                                                                className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <CalendarPlus className="h-4 w-4" />
                                                                            </button>
                                                                        ) : (
                                                                            <div className="w-8 flex-shrink-0" />
                                                                        )}

                                                                        {/* Remove */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeSlot(index)}
                                                                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(true)}
                            className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 text-sm h-10 shadow-sm"
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Şablonu sil
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10 text-sm font-semibold text-slate-500">
                                Vazgeç
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !name.trim()}
                                className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-10 text-sm font-bold px-6 shadow-sm rounded-lg"
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
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
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
