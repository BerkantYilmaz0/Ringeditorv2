'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    format, addDays, addMonths, startOfWeek, startOfMonth, endOfMonth,
    eachDayOfInterval, startOfWeek as soWeek, endOfWeek, isSameMonth,
    isToday, parseISO,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

import { getJobs, createJob, updateJob, deleteJob as apiDeleteJob, Job, getJobsCalendarStats, generateJobsFromTemplate } from '@/lib/jobs';
import { getTemplates, Template } from '@/lib/templates';
import { getAllRoutes, Route } from '@/lib/routes';
import { getVehicles, Vehicle } from '@/lib/devices';
import { getRingTypes, RingType } from '@/lib/ring-types';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import JobsForm from '@/components/schedules/JobsForm';
import SchedulerView from '@/components/schedules/SchedulerView';
import WeekCalendar from '@/components/schedules/WeekCalendar';

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | 'day' | 'list';

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Planlandı', IN_PROGRESS: 'Devam ediyor',
    COMPLETED: 'Tamamlandı', CANCELLED: 'İptal',
};
const STATUS_PILL: Record<string, string> = {
    PENDING: 'neutral', IN_PROGRESS: 'live', COMPLETED: 'ok', CANCELLED: 'danger',
};

function weekDays(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function fmt(d: Date | number, f: string) { return format(new Date(d), f, { locale: tr }); }

// ─── Gün Özet Paneli ──────────────────────────────────────────────────────────

function DaySummary({ date, jobs, onJobClick, onTemplateClick }: {
    date: string; jobs: Job[]; onJobClick: (j: Job) => void; onTemplateClick: () => void;
}) {
    const d = parseISO(date);
    const dayLabel = fmt(d, 'EEE · d MMMM');
    const byRing = useMemo(() => {
        const m = new Map<string, number>();
        jobs.forEach(j => {
            const name = j.route?.ringType?.name ?? 'Diğer';
            m.set(name, (m.get(name) ?? 0) + 1);
        });
        return Array.from(m.entries());
    }, [jobs]);

    const ringSummary = byRing.map(([n, c]) => `${c} ${n}`).join(' · ');

    return (
        <div style={{ borderTop: '2px solid var(--border)', padding: '20px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 2px 14px' }}>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize' }}>
                        {dayLabel} özeti
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                        {jobs.length} sefer planlandı{ringSummary ? ` · ${ringSummary}` : ''}
                    </p>
                </div>
                <button className="rp-quick-btn" style={{ fontSize: 12, padding: '7px 14px' }} onClick={onTemplateClick}>
                    Şablondan oluştur
                </button>
            </div>

            {jobs.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--ink-3)', padding: '8px 0 12px' }}>Bu gün için sefer yok.</p>
            ) : (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12 }}>
                    {[...jobs].sort((a, b) => a.dueTime - b.dueTime).map(j => {
                        const color = j.route?.color || j.route?.ringType?.color || '#0d9488';
                        const pill = STATUS_PILL[j.status] ?? 'neutral';
                        return (
                            <div
                                key={j.id}
                                onClick={() => onJobClick(j)}
                                style={{
                                    flexShrink: 0, minWidth: 200, maxWidth: 240,
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                                    borderTop: `3px solid ${color}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                                        {fmt(j.dueTime, 'HH:mm')}
                                    </span>
                                    <span className={`rp-pill rp-pill--${pill}`} style={{ fontSize: 10.5 }}>
                                        {pill === 'live' && <span className="rp-pill-dot rp-pill-dot--live" />}
                                        {STATUS_LABEL[j.status]}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginBottom: 2 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                        {j.route?.ringType?.name ?? j.route?.name ?? '—'}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11.5, fontFamily: '"JetBrains Mono",monospace', color: 'var(--ink)', fontWeight: 600 }}>
                                    {j.vehicle?.plate ?? '—'}
                                </div>
                                {j.vehicle?.driver?.name && (
                                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{j.vehicle.driver.name}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Yeni Sefer Modalı ────────────────────────────────────────────────────────

function NewJobModal({ open, onClose, date, time, routes, vehicles, onCreated }: {
    open: boolean; onClose: () => void; date: string; time: string;
    routes: Route[]; vehicles: Vehicle[]; onCreated: () => void;
}) {
    const [jobTime, setJobTime] = useState(time);
    const [routeId, setRouteId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => { setJobTime(time); }, [time]);
    useEffect(() => { if (!open) { setRouteId(''); setVehicleId(''); } }, [open]);

    async function handle() {
        if (!routeId || !vehicleId || !jobTime) return toast.error('Lütfen tüm alanları doldurun.');
        setBusy(true);
        try {
            const [h, m] = jobTime.split(':').map(Number);
            const d = parseISO(date);
            d.setHours(h, m, 0, 0);
            await createJob({ routeId: parseInt(routeId), vehicleId, dueTime: d.getTime(), status: 'PENDING', type: 'REGULAR' });
            toast.success('Sefer oluşturuldu.');
            onCreated();
            onClose();
        } catch (e: unknown) {
            toast.error((e as Error).message || 'Sefer oluşturulamadı.');
        } finally { setBusy(false); }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
                <div style={{ height: 4, background: 'var(--accent)' }} />
                <div style={{ padding: 24 }}>
                    <DialogHeader style={{ marginBottom: 20 }}>
                        <DialogTitle style={{ fontSize: 16, fontWeight: 700 }}>Yeni Sefer Ekle</DialogTitle>
                        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                            {fmt(parseISO(date), 'dd MMMM yyyy, EEEE')}
                        </p>
                    </DialogHeader>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <Label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kalkış Saati</Label>
                            <input
                                type="time"
                                value={jobTime}
                                onChange={e => setJobTime(e.target.value)}
                                style={{
                                    display: 'block', width: '100%', marginTop: 6,
                                    padding: '9px 12px', border: '1px solid var(--border)',
                                    borderRadius: 8, fontSize: 13, fontFamily: '"JetBrains Mono",monospace',
                                    background: 'var(--bg-2)', color: 'var(--ink)', outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <Label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hat</Label>
                            <Select onValueChange={setRouteId} value={routeId}>
                                <SelectTrigger style={{ marginTop: 6, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-2)', fontSize: 13, height: 40 }}>
                                    <SelectValue placeholder="Hat seçin…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map(r => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color || '#0d9488', display: 'inline-block', flexShrink: 0 }} />
                                                {r.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Araç</Label>
                            <Select onValueChange={setVehicleId} value={vehicleId}>
                                <SelectTrigger style={{ marginTop: 6, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-2)', fontSize: 13, height: 40 }}>
                                    <SelectValue placeholder="Araç seçin…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600 }}>{v.plate}</span>
                                            <span style={{ marginLeft: 6, color: 'var(--ink-3)', fontSize: 11 }}>{v.brand} {v.model}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', gap: 8 }}>
                        <button onClick={onClose} style={{ appearance: 'none', border: '1px solid var(--border)', background: 'transparent', padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--ink-2)' }}>
                            İptal
                        </button>
                        <button onClick={handle} disabled={busy} className="rp-quick-btn">
                            {busy ? 'Kaydediliyor…' : 'Kaydet'}
                        </button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Aylık Görünüm ────────────────────────────────────────────────────────────

const MONTH_DAY_ABBR = ['Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function MonthCalendar({ monthDate, stats, selectedDate, onDayClick }: {
    monthDate: Date;
    stats: Record<string, number>;
    selectedDate: string;
    onDayClick: (date: string) => void;
}) {
    const weeks = useMemo(() => {
        const first = soWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
        const last  = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
        const allDays = eachDayOfInterval({ start: first, end: last });
        const rows: Date[][] = [];
        for (let i = 0; i < allDays.length; i += 7) rows.push(allDays.slice(i, i + 7));
        return rows;
    }, [monthDate]);

    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Gün başlıkları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid var(--border)' }}>
                {MONTH_DAY_ABBR.map(d => (
                    <div key={d} style={{ padding: '11px 14px', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Haftalar */}
            {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {week.map((day, di) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const inMonth = isSameMonth(day, monthDate);
                        const isTodayDay = isToday(day);
                        const isSelected = dateStr === selectedDate;
                        const count = stats[dateStr] ?? 0;

                        return (
                            <div
                                key={di}
                                onClick={() => inMonth && onDayClick(dateStr)}
                                style={{
                                    padding: '10px 14px 14px',
                                    borderLeft: di > 0 ? '1px solid var(--border)' : 'none',
                                    background: isSelected
                                        ? 'var(--accent-soft)'
                                        : isTodayDay
                                            ? 'rgba(13,148,136,0.05)'
                                            : 'transparent',
                                    cursor: inMonth ? 'pointer' : 'default',
                                    minHeight: 96,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    opacity: inMonth ? 1 : 0.3,
                                }}
                            >
                                {/* Gün numarası */}
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: isTodayDay ? 'var(--accent)' : 'transparent',
                                    fontSize: 13, fontWeight: isTodayDay ? 700 : 500,
                                    color: isTodayDay ? '#fff' : 'var(--ink)',
                                    flexShrink: 0,
                                }}>
                                    {format(day, 'd')}
                                </div>

                                {/* Sefer sayısı — düz metin */}
                                {count > 0 && inMonth && (
                                    <span style={{
                                        fontSize: 11.5,
                                        fontWeight: 500,
                                        color: 'var(--ink-2)',
                                        lineHeight: 1,
                                    }}>
                                        {count} sefer
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

// ─── Şablondan Oluştur Modalı ─────────────────────────────────────────────────

function TemplateGenerateModal({ open, onClose, defaultDate, onGenerated }: {
    open: boolean; onClose: () => void; defaultDate: string; onGenerated: () => void;
}) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [templateId, setTemplateId] = useState('');
    const [startDate, setStartDate] = useState(defaultDate);
    const [endDate, setEndDate] = useState(defaultDate);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (open) {
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            setTemplateId('');
            getTemplates().then(setTemplates).catch(() => {});
        }
    }, [open, defaultDate]);

    async function handle() {
        if (!templateId || !startDate || !endDate) return toast.error('Lütfen tüm alanları doldurun.');
        if (endDate < startDate) return toast.error('Bitiş tarihi başlangıçtan önce olamaz.');
        setBusy(true);
        try {
            const result = await generateJobsFromTemplate({
                templateId: parseInt(templateId),
                startDate,
                endDate,
            });
            toast.success(`${result.count ?? ''} sefer oluşturuldu.`);
            onGenerated();
            onClose();
        } catch (e: unknown) {
            toast.error((e as Error).message || 'Sefer oluşturulamadı.');
        } finally { setBusy(false); }
    }

    const selected = templates.find(t => t.id.toString() === templateId);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
                <div style={{ height: 4, background: 'var(--accent)' }} />
                <div style={{ padding: 24 }}>
                    <DialogHeader style={{ marginBottom: 20 }}>
                        <DialogTitle style={{ fontSize: 16, fontWeight: 700 }}>Şablondan Sefer Oluştur</DialogTitle>
                        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                            Seçilen şablondaki sefer planını belirtilen tarihe uygular.
                        </p>
                    </DialogHeader>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Şablon seçimi */}
                        <div>
                            <Label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Şablon</Label>
                            <Select onValueChange={setTemplateId} value={templateId}>
                                <SelectTrigger style={{ marginTop: 6, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-2)', fontSize: 13, height: 40 }}>
                                    <SelectValue placeholder={templates.length === 0 ? 'Şablon yükleniyor…' : 'Şablon seçin…'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                                                <span style={{ fontWeight: 600 }}>{t.name}</span>
                                                {t._count?.jobs !== undefined && (
                                                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: '"JetBrains Mono",monospace' }}>
                                                        {t._count.jobs} sefer
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selected?.description && (
                                <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 5 }}>{selected.description}</p>
                            )}
                        </div>

                        {/* Tarih aralığı */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <Label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Başlangıç</Label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}
                                    style={{ display: 'block', width: '100%', marginTop: 6, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: '"JetBrains Mono",monospace', background: 'var(--bg-2)', color: 'var(--ink)', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <Label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bitiş</Label>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    style={{ display: 'block', width: '100%', marginTop: 6, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: '"JetBrains Mono",monospace', background: 'var(--bg-2)', color: 'var(--ink)', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Özet */}
                        {templateId && startDate && endDate && (
                            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ink-2)' }}>
                                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{selected?.name}</strong> şablonu{' '}
                                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600 }}>{startDate}</span>
                                {startDate !== endDate && (
                                    <> → <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600 }}>{endDate}</span></>
                                )}{' '}
                                tarih{startDate !== endDate ? ' aralığına' : 'e'} uygulanacak.
                            </div>
                        )}
                    </div>

                    <DialogFooter style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', gap: 8 }}>
                        <button onClick={onClose} style={{ appearance: 'none', border: '1px solid var(--border)', background: 'transparent', padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--ink-2)' }}>
                            İptal
                        </button>
                        <button onClick={handle} disabled={busy || !templateId} className="rp-quick-btn" style={{ opacity: !templateId ? 0.5 : 1 }}>
                            {busy ? 'Oluşturuluyor…' : 'Seferleri Oluştur'}
                        </button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Liste Görünümü ────────────────────────────────────────────────────────────

function ListView({ jobs, onJobClick }: { jobs: Job[]; onJobClick: (j: Job) => void }) {
    const sorted = useMemo(() => [...jobs].sort((a, b) => a.dueTime - b.dueTime), [jobs]);
    if (sorted.length === 0) return (
        <div className="rp-empty"><div className="rp-empty-mark" /><h3>Sefer bulunamadı</h3><p>Bu haftaya ait sefer yok.</p></div>
    );
    return (
        <div className="rp-table">
            <div className="rp-th">
                <div>Tarih</div>
                <div>Kalkış</div>
                <div>Araç</div>
                <div>Güzergah</div>
                <div>Ring</div>
                <div>Durum</div>
                <div />
            </div>
            {sorted.map(j => {
                const color = j.route?.color || j.route?.ringType?.color;
                const pill = STATUS_PILL[j.status] ?? 'neutral';
                return (
                    <div key={j.id} className="rp-tr" onClick={() => onJobClick(j)}>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12, color: 'var(--ink-3)' }}>{fmt(j.dueTime, 'dd MMM')}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 14 }}>{fmt(j.dueTime, 'HH:mm')}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 12 }}>{j.vehicle?.plate ?? '—'}</div>
                        <div style={{ fontSize: 13 }}>{j.route?.name ?? '—'}</div>
                        <div>
                            {j.route?.ringType ? (
                                <span className="rp-pill rp-pill--ghost">
                                    {color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 4 }} />}
                                    {j.route.ringType.name}
                                </span>
                            ) : '—'}
                        </div>
                        <div><span className={`rp-pill rp-pill--${pill}`}>{STATUS_LABEL[j.status]}</span></div>
                        <div className="rp-cell-actions">
                            <button className="rp-row-action">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

function SchedulesPageInner() {
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [monthDate, setMonthDate] = useState<Date>(() => startOfMonth(new Date()));
    const [monthStats, setMonthStats] = useState<Record<string, number>>({});
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    const [weekJobs, setWeekJobs] = useState<Record<string, Job[]>>({});
    const [dayJobs, setDayJobs] = useState<Job[]>([]);
    const [weekLoading, setWeekLoading] = useState(false);

    const [routes, setRoutes] = useState<Route[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [ringTypes, setRingTypes] = useState<RingType[]>([]);
    const [activeRingTypeId, setActiveRingTypeId] = useState<number | null>(null);

    const [newJobModal, setNewJobModal] = useState(false);
    const [newJobTime, setNewJobTime] = useState('08:00');
    const [newJobDate, setNewJobDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [editJobId, setEditJobId] = useState<number | null>(null);
    const [editFormOpen, setEditFormOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<Job | null>(null);
    const [templateModal, setTemplateModal] = useState(false);
    const [templateModalDate, setTemplateModalDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Read ?q= from URL and switch to list view with search filter
    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setSearchQuery(q);
            setViewMode('list');
        }
    }, [searchParams]);

    const days = useMemo(() => weekDays(weekStart), [weekStart]);

    const weekLabel = useMemo(() => {
        const s = days[0], e = days[6];
        if (format(s, 'MM') === format(e, 'MM')) {
            return `${format(s, 'd')} – ${format(e, 'd MMMM yyyy', { locale: tr })}`;
        }
        return `${format(s, 'd MMM', { locale: tr })} – ${format(e, 'd MMM yyyy', { locale: tr })}`;
    }, [days]);

    // Başlangıç verileri
    useEffect(() => {
        Promise.all([getAllRoutes(), getVehicles(1, 200), getRingTypes()]).then(([r, v, rt]) => {
            setRoutes(r);
            setVehicles(v.vehicles);
            setRingTypes(rt);
        });
    }, []);

    // Haftalık iş yükü
    const fetchWeek = useCallback(async () => {
        setWeekLoading(true);
        try {
            const results = await Promise.all(
                weekDays(weekStart).map(d =>
                    getJobs(1, 200, { date: format(d, 'yyyy-MM-dd') })
                        .then(res => ({ date: format(d, 'yyyy-MM-dd'), jobs: res.data }))
                        .catch(() => ({ date: format(d, 'yyyy-MM-dd'), jobs: [] }))
                )
            );
            const m: Record<string, Job[]> = {};
            results.forEach(r => { m[r.date] = r.jobs; });
            setWeekJobs(m);
        } finally { setWeekLoading(false); }
    }, [weekStart]);

    useEffect(() => { fetchWeek(); }, [fetchWeek]);

    // Seçili gün yükle (gün görünümü için)
    const fetchDay = useCallback(async (date: string) => {
        const res = await getJobs(1, 200, { date }).catch(() => ({ data: [] }));
        setDayJobs(res.data);
    }, []);

    // Aylık istatistik
    const fetchMonthStats = useCallback(async (month: Date) => {
        const key = format(month, 'yyyy-MM');
        const data = await getJobsCalendarStats(key).catch(() => ({}));
        setMonthStats(data as Record<string, number>);
    }, []);

    useEffect(() => {
        if (viewMode === 'month') fetchMonthStats(monthDate);
    }, [viewMode, monthDate, fetchMonthStats]);

    useEffect(() => {
        if (viewMode === 'day') fetchDay(selectedDate);
    }, [viewMode, selectedDate, fetchDay]);

    const allWeekJobs = useMemo(() => Object.values(weekJobs).flat(), [weekJobs]);

    const handleDayClick = (date: string) => {
        setSelectedDate(date);
    };

    const handleJobClick = (job: Job) => {
        setEditJobId(job.id);
        setEditFormOpen(true);
    };

    const handleSlotClick = (date: string, time: string) => {
        setNewJobDate(date);
        setNewJobTime(time);
        setNewJobModal(true);
    };

    const handleCreated = () => { fetchWeek(); if (viewMode === 'day') fetchDay(selectedDate); };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            await apiDeleteJob(pendingDelete.id);
            toast.success('Sefer silindi.');
            fetchWeek();
            setPendingDelete(null);
        } catch { toast.error('Sefer silinemedi.'); }
    };

    const goToday = () => {
        setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
        setMonthDate(startOfMonth(new Date()));
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const prevPeriod = () => {
        if (viewMode === 'month') setMonthDate(d => addMonths(d, -1));
        else setWeekStart(d => addDays(d, -7));
    };
    const nextPeriod = () => {
        if (viewMode === 'month') setMonthDate(d => addMonths(d, 1));
        else setWeekStart(d => addDays(d, 7));
    };

    const periodLabel = viewMode === 'month'
        ? format(monthDate, 'MMMM yyyy', { locale: tr })
        : weekLabel;

    // Aylık görünümde güne tıklanınca haftalık görünüme geç
    const handleMonthDayClick = (date: string) => {
        const d = parseISO(date);
        setSelectedDate(date);
        setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
        setViewMode('week');
    };

    return (
        <>
            {/* ── Sayfa başlığı ── */}
            <section className="rp-pagehead">
                <div>
                    <div className="rp-crumbs">
                        <span>Operasyon</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        <span>Sefer Planlama</span>
                    </div>
                    <h1 className="rp-h1">Sefer Planlama</h1>
                    <p className="rp-sub">Haftalık takvim üzerinden seferleri oluştur, düzenle ve sürükle-bırak ile yeniden zamanla.</p>
                </div>
                <div className="rp-pagehead-right">
                    <div className="rp-segmented">
                        <button className={viewMode === 'month' ? 'is-active' : ''} onClick={() => setViewMode('month')}>Ay</button>
                        <button className={viewMode === 'week'  ? 'is-active' : ''} onClick={() => setViewMode('week')}>Hafta</button>
                        <button className={viewMode === 'day'   ? 'is-active' : ''} onClick={() => setViewMode('day')}>Gün</button>
                        <button className={viewMode === 'list'  ? 'is-active' : ''} onClick={() => setViewMode('list')}>Liste</button>
                    </div>
                    {(viewMode === 'week' || viewMode === 'day') && (
                        <button
                            onClick={() => setEditFormOpen(true)}
                            style={{
                                appearance: 'none', border: '1px solid var(--border)',
                                background: 'var(--surface)', borderRadius: 8,
                                padding: '7px 14px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', color: 'var(--ink-2)',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Seferleri Düzenle
                        </button>
                    )}
                    <button className="rp-quick-btn" onClick={() => { setNewJobDate(selectedDate); setNewJobTime('08:00'); setNewJobModal(true); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        Yeni sefer
                    </button>
                </div>
            </section>

            {/* ── Hafta nav + ring filtresi ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={prevPeriod} style={{ appearance: 'none', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button onClick={nextPeriod} style={{ appearance: 'none', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', textTransform: viewMode === 'month' ? 'capitalize' : 'none' }}>{periodLabel}</span>
                    <button onClick={goToday} style={{ appearance: 'none', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--ink-2)', marginLeft: 4 }}>
                        Bugüne dön
                    </button>
                    {weekLoading && (
                        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Yükleniyor…</span>
                    )}
                </div>

                {/* Ring filtresi — sadece hafta/gün görünümünde */}
                {ringTypes.length > 0 && (viewMode === 'week' || viewMode === 'day') && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveRingTypeId(null)}
                            style={{
                                appearance: 'none', border: `1.5px solid ${activeRingTypeId === null ? 'var(--accent)' : 'var(--border)'}`,
                                background: activeRingTypeId === null ? 'var(--accent-soft)' : 'var(--surface)',
                                borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', color: activeRingTypeId === null ? 'var(--accent)' : 'var(--ink-2)',
                            }}
                        >
                            Tüm ringler
                        </button>
                        {ringTypes.map(rt => (
                            <button
                                key={rt.id}
                                onClick={() => setActiveRingTypeId(activeRingTypeId === rt.id ? null : rt.id)}
                                style={{
                                    appearance: 'none',
                                    border: `1.5px solid ${activeRingTypeId === rt.id ? (rt.color || 'var(--accent)') : 'var(--border)'}`,
                                    background: activeRingTypeId === rt.id ? `${rt.color}18` : 'var(--surface)',
                                    borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', color: activeRingTypeId === rt.id ? (rt.color || 'var(--accent)') : 'var(--ink-2)',
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                }}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: rt.color || '#ccc' }} />
                                {rt.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Ana içerik ── */}
            {viewMode === 'month' && (
                <MonthCalendar
                    monthDate={monthDate}
                    stats={monthStats}
                    selectedDate={selectedDate}
                    onDayClick={handleMonthDayClick}
                />
            )}

            {viewMode === 'week' && (
                <>
                    <WeekCalendar
                        days={days}
                        weekJobs={weekJobs}
                        selectedDate={selectedDate}
                        activeRingTypeId={activeRingTypeId}
                        ringTypes={ringTypes}
                        onDayClick={handleDayClick}
                        onJobClick={handleJobClick}
                        onSlotClick={handleSlotClick}
                    />

                    {/* Gün özet paneli */}
                    {weekJobs[selectedDate] !== undefined && (
                        <DaySummary
                            date={selectedDate}
                            jobs={weekJobs[selectedDate] ?? []}
                            onJobClick={handleJobClick}
                            onTemplateClick={() => { setTemplateModalDate(selectedDate); setTemplateModal(true); }}
                        />
                    )}
                </>
            )}

            {viewMode === 'day' && (
                <div style={{ height: 'calc(100vh - 280px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    <SchedulerView
                        date={selectedDate}
                        jobs={dayJobs}
                        onEventClick={handleJobClick}
                        onSlotClick={(time) => handleSlotClick(selectedDate, time)}
                        onEventDrop={async (job, newStart) => {
                            try {
                                await updateJob(job.id, { dueTime: newStart.getTime() });
                                toast.success('Sefer saati güncellendi.');
                                fetchDay(selectedDate);
                                fetchWeek();
                            } catch { toast.error('Güncelleme başarısız.'); }
                        }}
                    />
                </div>
            )}

            {viewMode === 'list' && (
                <article className="rp-card">
                    <div className="rp-card-head">
                        <div>
                            <h2 className="rp-card-title">Bu Haftaki Seferler</h2>
                            <span className="rp-card-sub">{allWeekJobs.length} sefer · {weekLabel}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="rp-search" style={{ width: 260 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <input
                                    placeholder="Plaka, güzergah, ring ara…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
                                    autoFocus={!!searchQuery}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: '0 2px', fontSize: 16, lineHeight: 1 }}>×</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <ListView
                        jobs={searchQuery
                            ? allWeekJobs.filter(j => {
                                const q = searchQuery.toLowerCase();
                                return (
                                    j.vehicle?.plate?.toLowerCase().includes(q) ||
                                    j.route?.name?.toLowerCase().includes(q) ||
                                    j.route?.ringType?.name?.toLowerCase().includes(q)
                                );
                            })
                            : allWeekJobs
                        }
                        onJobClick={handleJobClick}
                    />
                </article>
            )}

            {/* ── Modaller ── */}
            <NewJobModal
                open={newJobModal}
                onClose={() => setNewJobModal(false)}
                date={newJobDate}
                time={newJobTime}
                routes={routes}
                vehicles={vehicles}
                onCreated={handleCreated}
            />

            <JobsForm
                open={editFormOpen}
                onOpenChange={open => { setEditFormOpen(open); if (!open) setEditJobId(null); }}
                date={selectedDate}
                jobs={weekJobs[selectedDate] ?? []}
                routes={routes}
                vehicles={vehicles}
                ringTypes={ringTypes}
                onUpdate={handleCreated}
                initialEditingJobId={editJobId}
            />

            <TemplateGenerateModal
                open={templateModal}
                onClose={() => setTemplateModal(false)}
                defaultDate={templateModalDate}
                onGenerated={handleCreated}
            />

            <AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Seferi sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete && `${fmt(pendingDelete.dueTime, 'HH:mm')} saatindeki bu seferi silmek istediğinizden emin misiniz?`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Sil</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function SchedulesPage() {
    return (
        <Suspense>
            <SchedulesPageInner />
        </Suspense>
    );
}
