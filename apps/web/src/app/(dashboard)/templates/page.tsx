'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Clock,
    Copy,
    Trash2,
    Loader2,
    CalendarCheck,
    ToggleLeft,
    ToggleRight,
    Pencil,
    Check,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

import {
    getTemplates,
    deleteTemplate,
    createTemplate,
    updateTemplate,
    createTemplateJob,
    getTemplateJobs,
    Template,
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
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

import TemplateSeferEditor from '../../../components/schedules/TemplateSeferEditor';
import PreviewTemplateDialog from '../../../components/schedules/PreviewTemplateDialog';

const CARD_DAYS = [
    { key: 'pzt', label: 'P' },
    { key: 'sal', label: 'S' },
    { key: 'car', label: 'Ç' },
    { key: 'per', label: 'P' },
    { key: 'cum', label: 'C' },
    { key: 'cmt', label: 'C' },
    { key: 'paz', label: 'P' },
];

const MODAL_DAYS = [
    { key: 'pzt', label: 'Pzt' },
    { key: 'sal', label: 'Sal' },
    { key: 'car', label: 'Çar' },
    { key: 'per', label: 'Per' },
    { key: 'cum', label: 'Cum' },
    { key: 'cmt', label: 'Cmt' },
    { key: 'paz', label: 'Paz' },
];

const DEFAULT_WEEKDAYS = ['pzt', 'sal', 'car', 'per', 'cum'];

interface TemplateCardMeta {
    vehicleCount: number;
    rings: { name: string; color: string }[];
}

interface NewSlot {
    time: string;
    routeId: string;
    vehicleId: string;
}

type FilterType = 'all' | 'active' | 'passive';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [templateMeta, setTemplateMeta] = useState<Record<number, TemplateCardMeta>>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [activeOverrides, setActiveOverrides] = useState<Record<number, boolean>>({});

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    // Create modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newActiveDays, setNewActiveDays] = useState<string[]>(DEFAULT_WEEKDAYS);
    const [newSlots, setNewSlots] = useState<NewSlot[]>([{ time: '08:00', routeId: '', vehicleId: '' }]);
    const [isSaving, setIsSaving] = useState(false);

    // Dropdown data for create modal
    const [routes, setRoutes] = useState<Route[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [ringTypes, setRingTypes] = useState<RingType[]>([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Inline edit
    const [inlineEditId, setInlineEditId] = useState<number | null>(null);
    const [inlineEditName, setInlineEditName] = useState('');
    const inlineRef = useRef<HTMLInputElement>(null);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await getTemplates();
            setTemplates(data);

            const metaMap: Record<number, TemplateCardMeta> = {};
            await Promise.all(
                data.map(async (t) => {
                    try {
                        const jobs = await getTemplateJobs(t.id);
                        const uniqueVehicles = new Set(jobs.map(j => j.vehicleId).filter(Boolean));
                        const seenRings = new Map<string, string>();
                        jobs.forEach(j => {
                            if (j.ringType?.name) seenRings.set(j.ringType.name, j.ringType.color || '#94a3b8');
                        });
                        metaMap[t.id] = {
                            vehicleCount: Math.max(uniqueVehicles.size, jobs.length > 0 ? 1 : 0),
                            rings: Array.from(seenRings.entries()).map(([name, color]) => ({ name, color })),
                        };
                    } catch {
                        metaMap[t.id] = { vehicleCount: 0, rings: [] };
                    }
                })
            );
            setTemplateMeta(metaMap);
        } catch {
            toast.error('Şablonlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        setDropdownLoading(true);
        try {
            const [r, v, rt] = await Promise.all([getAllRoutes(), getVehicles(1, 100), getRingTypes()]);
            setRoutes(r);
            setVehicles(v.vehicles);
            setRingTypes(rt);
        } catch {
            // silent
        } finally {
            setDropdownLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const isActive = (t: Template) => {
        if (activeOverrides[t.id] !== undefined) return activeOverrides[t.id];
        return !t.isDeleted;
    };

    const handleToggle = (e: React.MouseEvent, t: Template) => {
        e.stopPropagation();
        setActiveOverrides(prev => ({ ...prev, [t.id]: !isActive(t) }));
    };

    const handleOpenCreate = () => {
        setNewName('');
        setNewDesc('');
        setNewActiveDays(DEFAULT_WEEKDAYS);
        setNewSlots([{ time: '08:00', routeId: '', vehicleId: '' }]);
        fetchDropdownData();
        setIsCreateOpen(true);
    };

    const getRingTypeIdForRoute = (routeId: string): number | null => {
        const route = routes.find(r => r.id.toString() === routeId);
        return route?.ringTypeId ?? null;
    };

    const addNewSlot = () => {
        const last = newSlots[newSlots.length - 1];
        let nextTime = '08:00';
        if (last?.time) {
            const [h, m] = last.time.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m + 30, 0, 0);
            nextTime = format(d, 'HH:mm');
        }
        setNewSlots(prev => [...prev, { time: nextTime, routeId: '', vehicleId: '' }]);
    };

    const updateNewSlot = (i: number, field: keyof NewSlot, val: string) => {
        setNewSlots(prev => prev.map((s, idx) =>
            idx === i ? { ...s, [field]: val, ...(field === 'routeId' ? { vehicleId: '' } : {}) } : s
        ));
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        try {
            const created = await createTemplate({
                name: newName.trim(),
                description: newDesc.trim() || undefined,
            });

            // Save slots
            for (const slot of newSlots) {
                if (!slot.routeId || !slot.time) continue;
                const ringTypeId = getRingTypeIdForRoute(slot.routeId);
                if (!ringTypeId) continue;
                const [h, m] = slot.time.split(':');
                const d = new Date();
                d.setHours(parseInt(h), parseInt(m), 0, 0);
                await createTemplateJob({
                    templateId: created.id,
                    dueTime: d.getTime(),
                    ringTypeId,
                    routeId: parseInt(slot.routeId),
                    vehicleId: slot.vehicleId || undefined,
                    status: 'PENDING',
                });
            }

            toast.success('Şablon oluşturuldu');
            setIsCreateOpen(false);
            await fetchTemplates();
        } catch {
            toast.error('Şablon oluşturulamadı');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClone = async (e: React.MouseEvent, t: Template) => {
        e.stopPropagation();
        try {
            await createTemplate({ name: `${t.name} (Kopya)`, description: t.description });
            toast.success('Şablon klonlandı');
            fetchTemplates();
        } catch {
            toast.error('Klonlama başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteTemplate(id);
            toast.success('Şablon silindi');
            fetchTemplates();
        } catch {
            toast.error('Şablon silinemedi');
        }
    };

    const startInlineEdit = (e: React.MouseEvent, t: Template) => {
        e.stopPropagation();
        setInlineEditId(t.id);
        setInlineEditName(t.name);
        setTimeout(() => inlineRef.current?.focus(), 50);
    };

    const saveInlineEdit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!inlineEditId || !inlineEditName.trim()) { setInlineEditId(null); return; }
        try {
            await updateTemplate(inlineEditId, { name: inlineEditName.trim() });
            toast.success('İsim güncellendi');
            fetchTemplates();
        } catch {
            toast.error('Güncelleme başarısız');
        }
        setInlineEditId(null);
    };

    const filteredTemplates = templates.filter(t => {
        if (filter === 'active') return isActive(t);
        if (filter === 'passive') return !isActive(t);
        return true;
    });

    const activeCount = templates.filter(t => isActive(t)).length;
    const passiveCount = templates.filter(t => !isActive(t)).length;

    const relativeTime = (s: string) => {
        try { return formatDistanceToNow(new Date(s), { addSuffix: true, locale: tr }); }
        catch { return '—'; }
    };

    const getVehicleLabel = (v: Vehicle) =>
        v.driver?.name ? `${v.plate} · ${v.driver.name}` : v.plate;

    const routesByRing = ringTypes.map(rt => ({
        ring: rt,
        routes: routes.filter(r => r.ringTypeId === rt.id),
    })).filter(g => g.routes.length > 0);

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <span>Operasyon</span>
                <span>/</span>
                <span className="text-slate-600 font-medium">Şablonlar</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sefer Şablonları</h1>
                    <p className="text-slate-500 text-sm mt-1">Tekrar eden sefer planlarını şablon olarak kaydet, takvime tek tıkla uygula.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        {([['all', 'Tümü', templates.length], ['active', 'Aktif', activeCount], ['passive', 'Pasif', passiveCount]] as [FilterType, string, number][]).map(([key, label, count]) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {label} <span className="ml-1 text-xs text-slate-400">{count}</span>
                            </button>
                        ))}
                    </div>
                    <Button
                        onClick={handleOpenCreate}
                        className="bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm h-9 px-4 text-sm"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Yeni şablon
                    </Button>
                </div>
            </div>

            {/* Card Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0d9488]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTemplates.map((t) => {
                        const meta = templateMeta[t.id];
                        const active = isActive(t);
                        const jobCount = t._count?.jobs ?? 0;
                        const isInlineEditing = inlineEditId === t.id;

                        return (
                            <div
                                key={t.id}
                                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg transition-all cursor-pointer group relative"
                                onClick={() => {
                                    if (inlineEditId) return;
                                    setSelectedTemplate(t);
                                    setIsEditorOpen(true);
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${active ? 'text-[#0d9488] bg-[#f0fdf9]' : 'text-slate-400 bg-slate-100'}`}>
                                            {active ? 'Aktif' : 'Pasif'}
                                        </span>
                                        <button onClick={(e) => handleToggle(e, t)} className="text-slate-300 hover:text-[#0d9488] transition-colors">
                                            {active ? <ToggleRight className="h-5 w-5 text-[#0d9488]" /> : <ToggleLeft className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Name inline edit */}
                                <div>
                                    {isInlineEditing ? (
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                ref={inlineRef}
                                                value={inlineEditName}
                                                onChange={e => setInlineEditName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveInlineEdit(e as unknown as React.MouseEvent);
                                                    if (e.key === 'Escape') setInlineEditId(null);
                                                }}
                                                className="flex-1 text-sm font-semibold text-slate-800 border-b-2 border-[#0d9488] bg-transparent outline-none py-0.5"
                                            />
                                            <button onClick={saveInlineEdit} className="text-[#0d9488] p-0.5"><Check className="h-4 w-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setInlineEditId(null); }} className="text-slate-400 p-0.5"><X className="h-4 w-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 group/name">
                                            <h3 className="font-semibold text-slate-800 text-sm leading-tight">{t.name}</h3>
                                            <button
                                                onClick={(e) => startInlineEdit(e, t)}
                                                className="opacity-0 group-hover/name:opacity-100 text-slate-300 hover:text-[#0d9488] transition-all p-0.5 ml-1"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                    {t.description && (
                                        <p className="text-slate-400 text-xs mt-1 line-clamp-1">{t.description}</p>
                                    )}
                                </div>

                                {/* Day chips */}
                                <div className="flex items-center gap-1.5">
                                    {CARD_DAYS.map((d, i) => (
                                        <span
                                            key={i}
                                            className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${DEFAULT_WEEKDAYS.includes(d.key) && active ? 'bg-[#0d9488] text-white' : 'bg-slate-100 text-slate-400'}`}
                                        >
                                            {d.label}
                                        </span>
                                    ))}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                                    <div>
                                        <div className="text-lg font-bold text-slate-800">{jobCount}</div>
                                        <div className="text-[11px] text-slate-400">sefer/hafta</div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div>
                                        <div className="text-lg font-bold text-slate-800">{meta?.vehicleCount ?? '—'}</div>
                                        <div className="text-[11px] text-slate-400">araç</div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div className="min-w-0">
                                        {meta?.rings && meta.rings.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 14px)', gap: '4px', marginBottom: 2 }}>
                                                {meta.rings.map(r => (
                                                    <span
                                                        key={r.name}
                                                        title={r.name}
                                                        style={{ background: r.color, width: 12, height: 12, borderRadius: '50%', display: 'inline-block', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm font-bold text-slate-300" style={{ marginBottom: 2 }}>—</div>
                                        )}
                                        <div className="text-[11px] text-slate-400">ring</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[11px] text-slate-400">Güncelleme: {relativeTime(t.updatedAt)}</span>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleClone(e, t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Klonla">
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(t.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Sil">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Takvime uygula */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t); setIsPreviewOpen(true); }}
                                    className="flex items-center gap-1.5 text-xs text-[#0d9488] hover:text-[#0f766e] font-medium transition-colors pt-2 border-t border-slate-100 w-full"
                                >
                                    <CalendarCheck className="h-3.5 w-3.5" />
                                    Takvime uygula →
                                </button>
                            </div>
                        );
                    })}

                    {/* Dashed new card */}
                    <button
                        onClick={handleOpenCreate}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-4 min-h-[280px] hover:border-[#0d9488] hover:bg-[#f0fdf9]/30 transition-all group"
                    >
                        <div className="w-12 h-12 bg-[#0d9488]/10 rounded-full flex items-center justify-center group-hover:bg-[#0d9488]/20 transition-colors">
                            <Plus className="h-6 w-6 text-[#0d9488]" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-600">Yeni şablon oluştur</p>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-[180px]">
                                Tekrar eden sefer planın varsa, kalıcı bir şablon olarak kaydet.
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* ── Yeni Şablon Modal (Image 8 layout) ── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl w-[88vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
                        <DialogTitle className="text-lg font-bold text-slate-800">Yeni Şablon</DialogTitle>
                        <DialogDescription className="text-sm text-slate-400">
                            Tekrar eden sefer planını şablon olarak kaydet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Name + Description */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Şablon adı</Label>
                                <Input
                                    placeholder="örn. Hafta içi sabah"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleCreate()}
                                    className="h-9 text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Açıklama</Label>
                                <Input
                                    placeholder="Kısa not (opsiyonel)"
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        {/* Active Days */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-600">Aktif günler</Label>
                            <div className="flex gap-1.5 flex-wrap">
                                {MODAL_DAYS.map(d => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() => setNewActiveDays(prev =>
                                            prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key]
                                        )}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${newActiveDays.includes(d.key)
                                            ? 'bg-[#0d9488] text-white'
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slots */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-slate-600">
                                    Sefer slotları ({newSlots.length})
                                </Label>
                                <button
                                    type="button"
                                    onClick={addNewSlot}
                                    className="text-xs text-[#0d9488] hover:text-[#0f766e] font-medium flex items-center gap-1"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Slot ekle
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                {dropdownLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {newSlots.map((slot, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-2.5">
                                                <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0">{i + 1}.</span>

                                                <input
                                                    type="time"
                                                    value={slot.time}
                                                    onChange={e => updateNewSlot(i, 'time', e.target.value)}
                                                    className="w-[88px] h-8 border border-slate-200 rounded-md px-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-white flex-shrink-0"
                                                />

                                                <select
                                                    value={slot.routeId}
                                                    onChange={e => updateNewSlot(i, 'routeId', e.target.value)}
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

                                                <select
                                                    value={slot.vehicleId}
                                                    onChange={e => updateNewSlot(i, 'vehicleId', e.target.value)}
                                                    className="w-[130px] h-8 border border-slate-200 rounded-md px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-white flex-shrink-0"
                                                >
                                                    <option value="">Otomatik</option>
                                                    {vehicles.map(v => (
                                                        <option key={v.id} value={v.id}>{getVehicleLabel(v)}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() => setNewSlots(prev => prev.filter((_, idx) => idx !== i))}
                                                    disabled={newSlots.length === 1}
                                                    className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-30"
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

                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-9 text-sm">
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSaving || !newName.trim()}
                            className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-9 text-sm px-5"
                        >
                            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            Oluştur
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Template Editor Modal */}
            {selectedTemplate && (
                <TemplateSeferEditor
                    open={isEditorOpen}
                    onOpenChange={setIsEditorOpen}
                    template={selectedTemplate}
                    onUpdate={fetchTemplates}
                />
            )}

            {/* Apply to Calendar Modal */}
            <PreviewTemplateDialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                template={selectedTemplate}
                onSuccess={() => setIsPreviewOpen(false)}
            />

            {/* Delete Confirm */}
            <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
                        <AlertDialogDescription>Bu işlem geri alınamaz. Şablon kalıcı olarak silinecek.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => { if (deleteConfirmId !== null) handleDelete(deleteConfirmId); setDeleteConfirmId(null); }}
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
