'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { updateJob } from '@/lib/jobs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, MapPin, Bus, Tag } from 'lucide-react';
import type { DashboardRoute } from '@/components/map/DashboardMap';

const DashboardMap = dynamic(() => import('@/components/map/DashboardMap'), {
    ssr: false,
    loading: () => (
        <div style={{ width: '100%', height: '100%', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Harita yükleniyor…
        </div>
    ),
});

// ─── Tipler ─────────────────────────────────────────────────────────────────

type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface Job {
    id: number;
    dueTime: string;
    status: JobStatus;
    vehicle?: {
        id?: string;
        plate: string;
        brand?: string;
        model?: string;
        driver?: { name: string };
    };
    route?: {
        name: string;
        description?: string;
        color?: string;
        ringType?: { name: string; color?: string };
        stops?: { sequence: number; stop: { name: string; lat?: number; lng?: number } }[];
    };
}

interface DashboardStats {
    todayJobCount: number;
    totalRoutes: number;
    totalVehicles: number;
    activeVehicles: number;
    upcomingJobs: Job[];
}

// ─── Yardımcılar ────────────────────────────────────────────────────────────

const TODAY_ISO = format(new Date(), 'yyyy-MM-dd');

function computeStatus(job: Job): 'planned' | 'live' | 'done' | 'cancelled' {
    if (job.status === 'CANCELLED') return 'cancelled';
    if (job.status === 'COMPLETED') return 'done';
    if (job.status === 'IN_PROGRESS') return 'live';
    const now = Date.now();
    const due = new Date(job.dueTime).getTime();
    if (due < now - 30 * 60 * 1000) return 'done';
    if (due <= now + 10 * 60 * 1000) return 'live';
    return 'planned';
}

const STATUS_TONE: Record<string, string> = {
    planned: 'neutral', live: 'live', done: 'ok', cancelled: 'danger',
};
const STATUS_LABEL: Record<string, string> = {
    planned: 'Planlandı', live: 'Devam ediyor', done: 'Tamamlandı', cancelled: 'İptal',
};

function StatusPill({ status }: { status: ReturnType<typeof computeStatus> }) {
    const tone = STATUS_TONE[status];
    return (
        <span className={`rp-pill rp-pill--${tone}`}>
            {tone === 'live' && <span className="rp-pill-dot rp-pill-dot--live" />}
            {STATUS_LABEL[status]}
        </span>
    );
}

// ─── Sefer Detay Modal ───────────────────────────────────────────────────────

function JobDetailModal({ job, open, onClose, onCompleted }: {
    job: Job | null; open: boolean; onClose: () => void; onCompleted: (id: number) => void
}) {
    const [busy, setBusy] = useState(false);
    if (!job) return null;
    const status = computeStatus(job);
    const dueMs = new Date(job.dueTime).getTime();
    const ringColor = job.route?.color || job.route?.ringType?.color || '#0d9488';

    async function handleComplete() {
        setBusy(true);
        try {
            await updateJob(job!.id, { status: 'COMPLETED' });
            toast.success('Sefer tamamlandı olarak işaretlendi.');
            onCompleted(job!.id);
            onClose();
        } catch { toast.error('Durum güncellenirken bir hata oluştu.'); }
        finally { setBusy(false); }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
                <div style={{ height: 5, background: ringColor }} />
                <div style={{ padding: 24 }}>
                    <DialogHeader style={{ marginBottom: 16 }}>
                        <DialogTitle style={{ fontSize: 17, fontWeight: 700 }}>Sefer Detayı</DialogTitle>
                    </DialogHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
                                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 17 }}>{format(dueMs, 'HH:mm', { locale: tr })}</span>
                                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{format(dueMs, 'dd MMM yyyy', { locale: tr })}</span>
                            </div>
                            <StatusPill status={status} />
                        </div>
                        {[
                            { icon: Bus, label: 'Araç', value: job.vehicle?.plate ?? '—', sub: job.vehicle?.driver?.name ? `Sürücü: ${job.vehicle.driver.name}` : undefined },
                            { icon: MapPin, label: 'Güzergah', value: job.route?.name ?? '—', sub: job.route?.description },
                            { icon: Tag, label: 'Ring Tipi', value: job.route?.ringType?.name ?? '—', color: job.route?.ringType?.color },
                        ].map(({ icon: Icon, label, value, sub, color }) => (
                            <div key={label} style={{ display: 'flex', gap: 12, padding: '0 4px' }}>
                                <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--ink-3)' }} />
                                <div>
                                    <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {color && <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />}
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
                                    </div>
                                    {sub && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{sub}</div>}
                                </div>
                            </div>
                        ))}
                        {job.route?.stops && job.route.stops.length > 0 && (
                            <div style={{ padding: '0 4px' }}>
                                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duraklar ({job.route.stops.length})</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {job.route.stops.sort((a, b) => a.sequence - b.sequence).map((rs, i) => (
                                        <span key={i} className="rp-pill rp-pill--ghost">{rs.stop.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {(status === 'planned' || status === 'live') && (
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                            <button className="rp-quick-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={handleComplete} disabled={busy}>
                                {busy ? 'İşleniyor…' : 'Tamamlandı İşaretle'}
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Harita + Canlı Seferler ─────────────────────────────────────────────────

function HeroSection({ routes, liveJobs }: { routes: DashboardRoute[]; liveJobs: Job[] }) {
    const [activeRouteId, setActiveRouteId] = useState<number | null>(null);

    const visibleRoutes = activeRouteId ? routes.filter(r => r.id === activeRouteId) : routes;
    const uniqueRingTypes = useMemo(() => {
        const seen = new Set<string>();
        return routes.filter(r => {
            const key = r.ringType?.name ?? r.name;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [routes]);

    return (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: 'var(--gap)' }}>
            {/* Harita kartı */}
            <article className="rp-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="rp-card-head">
                    <div>
                        <h2 className="rp-card-title">Canlı Operasyon</h2>
                        <span className="rp-card-sub">{liveJobs.length} araç görevde · gerçek zamanlı hat görünümü</span>
                    </div>
                    {/* Hat filtresi */}
                    <div className="rp-map-filters" style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: 3, gap: 2 }}>
                        <button
                            style={{ appearance: 'none', border: 0, background: activeRouteId === null ? 'var(--bg-2)' : 'transparent', font: 'inherit', fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', padding: '5px 11px', borderRadius: 6, cursor: 'pointer' }}
                            onClick={() => setActiveRouteId(null)}>Tümü</button>
                        {uniqueRingTypes.slice(0, 3).map(r => (
                            <button key={r.id}
                                style={{ appearance: 'none', border: 0, background: activeRouteId === r.id ? 'var(--bg-2)' : 'transparent', font: 'inherit', fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', padding: '5px 11px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                onClick={() => setActiveRouteId(activeRouteId === r.id ? null : r.id)}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color || r.ringType?.color || '#0d9488', display: 'inline-block' }} />
                                {r.ringType?.name || r.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leaflet harita */}
                <div style={{ position: 'relative', aspectRatio: '16/8.5', overflow: 'hidden' }}>
                    <DashboardMap routes={visibleRoutes} />
                </div>

                {/* Canlı sefer kartları */}
                {liveJobs.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 10, padding: '14px 18px 18px', borderTop: '1px solid var(--border)' }}>
                        {liveJobs.map(j => {
                            const color = j.route?.color || j.route?.ringType?.color || '#0d9488';
                            return (
                                <div key={j.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, flexWrap: 'wrap' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, color: 'var(--ink)' }}>{j.vehicle?.plate ?? '—'}</span>
                                        {j.vehicle?.driver?.name && (
                                            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>{j.vehicle.driver.name}</span>
                                        )}
                                        <span style={{ marginLeft: 'auto' }} className="rp-pill rp-pill--live">
                                            <span className="rp-pill-dot rp-pill-dot--live" /> Yolda
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--ink-2)' }}>
                                        <span>{format(new Date(j.dueTime), 'HH:mm', { locale: tr })}</span>
                                        <span>·</span>
                                        <span>{j.route?.name ?? '—'}</span>
                                        {j.route?.ringType && (
                                            <>
                                                <span>·</span>
                                                <span>{j.route.ringType.name}</span>
                                            </>
                                        )}
                                    </div>
                                    {/* İndeterminate ilerleme çubuğu */}
                                    <div style={{ height: 4, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: color, borderRadius: 999, width: '60%', opacity: 0.8 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </article>

            {/* Uyarılar */}
            <AlertsCard />
        </section>
    );
}

// ─── Uyarı Paneli ─────────────────────────────────────────────────────────

function AlertsCard() {
    const router = useRouter();
    return (
        <article className="rp-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="rp-card-head">
                <div>
                    <h2 className="rp-card-title">Dikkat Gerektirenler</h2>
                    <span className="rp-card-sub">Güncel operasyon durumu</span>
                </div>
            </div>
            <AlertsContent onViewAll={() => router.push('/schedules')} />
        </article>
    );
}

function AlertsContent({ onViewAll }: { onViewAll: () => void }) {
    const { data } = useQuery({
        queryKey: ['jobs-today', TODAY_ISO],
        queryFn: () => api.get<{ items: Job[] }>(`/jobs?date=${TODAY_ISO}&limit=200`),
        refetchInterval: 60_000,
    });
    const jobs = data?.items ?? [];

    const alerts = useMemo(() => {
        const now = Date.now();
        const items: { id: number; severity: 'high' | 'warn' | 'ok' | 'info'; title: string; sub: string; time: string }[] = [];
        jobs.forEach(j => {
            const due = new Date(j.dueTime).getTime();
            const timeStr = format(due, 'HH:mm', { locale: tr });
            const plate = j.vehicle?.plate ?? '—';
            const route = j.route?.name ?? '—';
            if (j.status === 'CANCELLED') {
                items.push({ id: j.id, severity: 'high', title: `${timeStr} seferi iptal edildi`, sub: `${plate} · ${route}`, time: timeStr });
            } else if (j.status === 'IN_PROGRESS') {
                items.push({ id: j.id, severity: 'ok', title: `${plate} sefere başladı`, sub: `${route} · kalkış ${timeStr}`, time: timeStr });
            } else if (j.status === 'PENDING' && due < now - 15 * 60 * 1000) {
                items.push({ id: j.id, severity: 'warn', title: `${plate} gecikmeli görünüyor`, sub: `${timeStr} · ${route}`, time: timeStr });
            }
        });
        return items.sort((a, b) => {
            const o: Record<string, number> = { high: 0, warn: 1, ok: 2, info: 3 };
            return (o[a.severity] ?? 3) - (o[b.severity] ?? 3);
        }).slice(0, 8);
    }, [jobs]);

    if (alerts.length === 0) return (
        <div className="rp-empty">
            <div className="rp-empty-mark" />
            <h3>Her şey yolunda</h3>
            <p>Dikkat gerektiren olay yok.</p>
        </div>
    );

    return (
        <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
                {alerts.map(a => (
                    <li key={a.id} style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 12, padding: '12px 18px', borderTop: '1px solid var(--border)', alignItems: 'flex-start' }}>
                        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 999, background: a.severity === 'high' ? 'var(--danger)' : a.severity === 'warn' ? 'var(--warn)' : a.severity === 'ok' ? 'var(--ok)' : 'var(--accent)' }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{a.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{a.sub}</div>
                        </div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11.5, color: 'var(--ink-3)' }}>{a.time}</div>
                    </li>
                ))}
            </ul>
            <button className="rp-card-more" onClick={onViewAll}>Tüm olayları gör →</button>
        </>
    );
}

// ─── Zaman Çizelgesi ─────────────────────────────────────────────────────────

const LEGEND = [
    { label: 'Planlandı',     bg: 'var(--bg-2)',                border: 'var(--border)',             dot: 'var(--ink-3)' },
    { label: 'Devam ediyor',  bg: 'var(--accent-soft)',         border: 'var(--accent)',              dot: 'var(--accent)' },
    { label: 'Tamamlandı',    bg: 'rgba(5,150,105,0.10)',       border: 'rgba(5,150,105,0.35)',       dot: 'var(--ok)' },
    { label: 'Gecikmeli',     bg: 'rgba(234,179,8,0.10)',       border: 'rgba(234,179,8,0.50)',       dot: '#eab308' },
    { label: 'İptal',         bg: 'rgba(220,38,38,0.08)',       border: 'rgba(220,38,38,0.30)',       dot: 'var(--danger)' },
] as const;

function TimelineCard({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
    // Saatlik aralık: veri varsa kapsayacak şekilde genişlet, yoksa 07-19
    const { startH, endH } = useMemo(() => {
        if (jobs.length === 0) return { startH: 7, endH: 19 };
        const mins = jobs.map(j => {
            const d = new Date(j.dueTime);
            return d.getHours() * 60 + d.getMinutes();
        });
        const lo = Math.max(0,  Math.floor(Math.min(...mins) / 60) - 1);
        const hi = Math.min(23, Math.ceil (Math.max(...mins) / 60) + 1);
        return { startH: lo, endH: hi };
    }, [jobs]);

    const SPAN = (endH - startH) * 60; // toplam dakika
    const pct  = (min: number) => `${Math.max(0, Math.min(100, ((min - startH * 60) / SPAN) * 100)).toFixed(3)}%`;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const nowInRange = nowMin >= startH * 60 && nowMin <= endH * 60;

    // Her saat için tick (her 1 saat)
    const ticks: number[] = [];
    for (let h = startH; h <= endH; h++) ticks.push(h);

    // Araç bazlı grupla — plaka + sürücü
    const byVehicle = useMemo(() => {
        const m = new Map<string, { plate: string; driver: string; jobs: Job[] }>();
        jobs.forEach(j => {
            const key   = j.vehicle?.plate ?? 'Belirsiz';
            const drv   = j.vehicle?.driver?.name ?? '—';
            if (!m.has(key)) m.set(key, { plate: key, driver: drv, jobs: [] });
            m.get(key)!.jobs.push(j);
        });
        return Array.from(m.values()).sort((a, b) => a.plate.localeCompare(b.plate));
    }, [jobs]);

    return (
        <article className="rp-card" style={{ overflow: 'hidden' }}>
            {/* ── Başlık ── */}
            <div className="rp-card-head" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 className="rp-card-title">Bugünün Zaman Çizelgesi</h2>
                    <span className="rp-card-sub">
                        {String(startH).padStart(2,'0')}:00 – {String(endH).padStart(2,'0')}:00 · araç bazlı sefer planı
                    </span>
                </div>
                {/* Renk legend */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {LEGEND.map(l => (
                        <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--ink-2)' }}>
                            <span style={{ display: 'inline-block', width: 24, height: 10, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}` }} />
                            {l.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Gantt alanı ── */}
            <div style={{ overflowX: 'auto', padding: '0 0 18px' }}>
                {/* minWidth: saatler arası ~80px, 160px sol kolon */}
                <div style={{ minWidth: `${160 + (endH - startH) * 80}px`, padding: '0 18px' }}>
                    {/* Saat tick başlığı */}
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ height: 36 }} />
                        <div style={{ position: 'relative', height: 36 }}>
                            {ticks.map(h => (
                                <div key={h} style={{
                                    position: 'absolute', top: 0, bottom: 0,
                                    left: pct(h * 60),
                                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 7,
                                }}>
                                    <span style={{
                                        transform: 'translateX(-50%)',
                                        fontSize: 10.5,
                                        fontFamily: '"JetBrains Mono",monospace',
                                        color: 'var(--ink-3)',
                                        whiteSpace: 'nowrap',
                                        fontWeight: 500,
                                    }}>
                                        {String(h).padStart(2,'0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Boş durum */}
                    {byVehicle.length === 0 && (
                        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                            Bugün için sefer bulunamadı.
                        </div>
                    )}

                    {/* Araç satırları */}
                    {byVehicle.map((veh, vi) => (
                        <div key={veh.plate} style={{
                            display: 'grid', gridTemplateColumns: '160px 1fr',
                            borderTop: '1px solid var(--border)',
                            background: vi % 2 === 1 ? 'rgba(0,0,0,0.012)' : 'transparent',
                        }}>
                            {/* Sol: plaka + sürücü */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                padding: '10px 12px 10px 0', gap: 2,
                            }}>
                                <div style={{
                                    fontFamily: '"JetBrains Mono",monospace',
                                    fontWeight: 700, fontSize: 11.5, color: 'var(--ink)',
                                    letterSpacing: '0.04em',
                                }}>
                                    {veh.plate}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>
                                    {veh.driver}
                                </div>
                            </div>

                            {/* Sağ: timeline şeridi */}
                            <div style={{ position: 'relative', height: 64 }}>
                                {/* Saat çizgileri (grid) */}
                                {ticks.map(h => (
                                    <div key={h} style={{
                                        position: 'absolute', top: 0, bottom: 0,
                                        left: pct(h * 60),
                                        width: 1,
                                        background: 'var(--border)',
                                        opacity: 0.5,
                                        pointerEvents: 'none',
                                    }} />
                                ))}

                                {/* "Şimdi" çizgisi — tüm satırlarda */}
                                {nowInRange && (
                                    <div style={{
                                        position: 'absolute', top: 0, bottom: 0,
                                        left: pct(nowMin),
                                        width: 2, background: 'var(--accent)',
                                        zIndex: 10, pointerEvents: 'none',
                                    }}>
                                        {vi === 0 && (
                                            <span style={{
                                                position: 'absolute', top: -4, left: -4,
                                                width: 10, height: 10,
                                                background: 'var(--accent)', borderRadius: '50%',
                                                boxShadow: '0 0 0 3px var(--accent-soft)',
                                                animation: 'rp-pulse 1.6s ease-in-out infinite',
                                            }} />
                                        )}
                                    </div>
                                )}

                                {/* Sefer blokları — fixed 96px wide, centered at dueTime */}
                                {veh.jobs.map(j => {
                                    const d      = new Date(j.dueTime);
                                    const dueMin = d.getHours() * 60 + d.getMinutes();
                                    const st     = computeStatus(j);
                                    const color  = j.route?.color || j.route?.ringType?.color || '#0d9488';

                                    const styleMap: Record<string, { bg: string; border: string; textColor: string }> = {
                                        planned:   { bg: 'var(--bg-2)',              border: 'var(--border)',            textColor: 'var(--ink-2)' },
                                        live:      { bg: 'var(--accent-soft)',       border: 'var(--accent)',             textColor: 'var(--accent)' },
                                        done:      { bg: 'rgba(5,150,105,0.10)',     border: 'rgba(5,150,105,0.35)',      textColor: 'var(--ok)' },
                                        cancelled: { bg: 'rgba(220,38,38,0.08)',     border: 'rgba(220,38,38,0.30)',      textColor: 'var(--danger)' },
                                    };
                                    const s = styleMap[st] ?? styleMap.planned;

                                    return (
                                        <button
                                            key={j.id}
                                            onClick={() => onSelect(j)}
                                            title={`${format(d, 'HH:mm')} · ${j.route?.name ?? ''}`}
                                            style={{
                                                position: 'absolute',
                                                top: 10, bottom: 10,
                                                left: `calc(${pct(dueMin)} - 48px)`,
                                                width: 96,
                                                background: s.bg,
                                                border: `1.5px solid ${s.border}`,
                                                borderRadius: 7,
                                                padding: '0 7px',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                cursor: 'pointer', font: 'inherit', fontSize: 11,
                                                overflow: 'hidden', zIndex: 2,
                                                textDecoration: st === 'cancelled' ? 'line-through' : 'none',
                                                opacity: st === 'cancelled' ? 0.7 : 1,
                                            }}
                                        >
                                            <span style={{
                                                width: 7, height: 7, borderRadius: '50%',
                                                background: color, flexShrink: 0,
                                                boxShadow: st === 'live' ? `0 0 0 2px ${color}40` : 'none',
                                                animation: st === 'live' ? 'rp-pulse 1.6s ease-in-out infinite' : 'none',
                                            }} />
                                            <span style={{
                                                fontFamily: '"JetBrains Mono",monospace',
                                                fontWeight: 700, fontSize: 10.5,
                                                color: s.textColor, flexShrink: 0,
                                            }}>
                                                {format(d, 'HH:mm')}
                                            </span>
                                            <span style={{
                                                fontSize: 10, color: 'var(--ink-3)',
                                                whiteSpace: 'nowrap', overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {j.route?.ringType?.name || j.route?.name || ''}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </article>
    );
}

// ─── Seferler Tablosu ────────────────────────────────────────────────────────

function TripsTable({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'issues'>('all');

    const filtered = useMemo(() => {
        const now = Date.now();
        return [...jobs]
            .sort((a, b) => new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime())
            .filter(j => {
                if (filter === 'live') return j.status === 'IN_PROGRESS';
                if (filter === 'issues') return j.status === 'CANCELLED';
                if (filter === 'upcoming') return new Date(j.dueTime).getTime() >= now && j.status !== 'CANCELLED';
                return true;
            });
    }, [jobs, filter]);

    const counts = useMemo(() => ({
        all: jobs.length,
        live: jobs.filter(j => j.status === 'IN_PROGRESS').length,
        issues: jobs.filter(j => j.status === 'CANCELLED').length,
    }), [jobs]);

    return (
        <article className="rp-card">
            <div className="rp-card-head">
                <div>
                    <h2 className="rp-card-title">Seferler</h2>
                    <span className="rp-card-sub">{filtered.length} kayıt görüntüleniyor</span>
                </div>
                <div className="rp-table-tools">
                    <div className="rp-segmented">
                        <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>Tümü <em>{counts.all}</em></button>
                        <button className={filter === 'upcoming' ? 'is-active' : ''} onClick={() => setFilter('upcoming')}>Yaklaşan</button>
                        <button className={filter === 'live' ? 'is-active' : ''} onClick={() => setFilter('live')}>Canlı <em>{counts.live}</em></button>
                        <button className={filter === 'issues' ? 'is-active' : ''} onClick={() => setFilter('issues')}>Sorunlu <em>{counts.issues}</em></button>
                    </div>
                </div>
            </div>
            {filtered.length === 0 ? (
                <div className="rp-empty">
                    <div className="rp-empty-mark" />
                    <h3>Sefer bulunamadı</h3>
                    <p>Bu filtre için kayıt yok.</p>
                </div>
            ) : (
                <div className="rp-table">
                    <div className="rp-th">
                        <div>Kalkış</div>
                        <div>Araç · Sürücü</div>
                        <div>Güzergah</div>
                        <div>Ring</div>
                        <div>Durum</div>
                        <div />
                    </div>
                    {filtered.map(j => {
                        const status = computeStatus(j);
                        const color = j.route?.color || j.route?.ringType?.color;
                        return (
                            <div key={j.id} className="rp-tr" onClick={() => onSelect(j)}>
                                <div>
                                    <div className="rp-cell-time-main">{format(new Date(j.dueTime), 'HH:mm', { locale: tr })}</div>
                                    <div className="rp-cell-time-end">{format(new Date(j.dueTime), 'dd MMM', { locale: tr })}</div>
                                </div>
                                <div>
                                    <div className="rp-cell-plate">{j.vehicle?.plate ?? '—'}</div>
                                    <div className="rp-cell-driver">{j.vehicle?.driver?.name ?? '—'}</div>
                                </div>
                                <div className="rp-cell-route">{j.route?.name ?? '—'}</div>
                                <div>
                                    {j.route?.ringType ? (
                                        <span className="rp-pill rp-pill--ghost">
                                            {color && <span className="rp-ring-dot" style={{ background: color }} />}
                                            {j.route.ringType.name}
                                        </span>
                                    ) : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                                </div>
                                <div><StatusPill status={status} /></div>
                                <div className="rp-cell-actions">
                                    <button className="rp-row-action" title="Detay"
                                        onClick={(e) => { e.stopPropagation(); onSelect(j); }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </article>
    );
}

// ─── Ana Sayfa ───────────────────────────────────────────────────────────────

type DateMode = 'today' | 'tomorrow' | 'week';

function getDateRange(mode: DateMode): { dateParam: string; label: string } {
    const today = new Date();
    if (mode === 'tomorrow') {
        const d = format(addDays(today, 1), 'yyyy-MM-dd');
        return { dateParam: d, label: d };
    }
    if (mode === 'week') {
        const start = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const end = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        return { dateParam: `${start}&endDate=${end}`, label: start };
    }
    return { dateParam: TODAY_ISO, label: TODAY_ISO };
}

export default function DashboardPage() {
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [dateMode, setDateMode] = useState<DateMode>('today');
    const queryClient = useQueryClient();

    const { dateParam } = getDateRange(dateMode);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
        refetchInterval: 60_000,
    });

    const { data: todayData, isLoading: jobsLoading } = useQuery({
        queryKey: ['jobs-today', dateParam],
        queryFn: () => api.get<{ items: Job[] }>(`/jobs?date=${dateParam}&limit=200`),
        refetchInterval: 60_000,
    });

    const { data: routesData } = useQuery({
        queryKey: ['routes-map'],
        queryFn: () => api.get<{ items: DashboardRoute[] }>('/routes?limit=100'),
        staleTime: 5 * 60_000,
    });

    const todayJobs = todayData?.items ?? [];
    const routes = routesData?.items ?? [];
    const liveJobs = todayJobs.filter(j => j.status === 'IN_PROGRESS');
    const isLoading = statsLoading || jobsLoading;

    const kpis = useMemo(() => ({
        done: todayJobs.filter(j => j.status === 'COMPLETED').length,
        live: liveJobs.length,
        cancelled: todayJobs.filter(j => j.status === 'CANCELLED').length,
    }), [todayJobs, liveJobs]);

    const onCompleted = () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['jobs-today', dateParam] });
    };

    return (
        <>
            {/* Sayfa başlığı */}
            <section className="rp-pagehead">
                <div>
                    <div className="rp-crumbs">
                        <span>Genel</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Dashboard</span>
                    </div>
                    <h1 className="rp-h1">Operasyon Merkezi</h1>
                    <p className="rp-sub">Bugünün seferleri, canlı araç durumu ve dikkat gerektiren olaylar.</p>
                </div>
                <div className="rp-pagehead-right">
                    <div className="rp-status-pill">
                        <span className="rp-status-dot rp-status-dot--live" />
                        <span>Tüm sistemler çalışıyor</span>
                    </div>
                    <div className="rp-segmented">
                        <button className={dateMode === 'today' ? 'is-active' : ''} onClick={() => setDateMode('today')}>Bugün</button>
                        <button className={dateMode === 'tomorrow' ? 'is-active' : ''} onClick={() => setDateMode('tomorrow')}>Yarın</button>
                        <button className={dateMode === 'week' ? 'is-active' : ''} onClick={() => setDateMode('week')}>Bu hafta</button>
                    </div>
                </div>
            </section>

            {/* KPI kartları */}
            <section className="rp-kpis">
                {[
                    {
                        label: 'Bugünkü Seferler',
                        value: isLoading ? null : (stats?.todayJobCount ?? 0),
                        sub: isLoading ? '—' : `${kpis.done} tamam · ${kpis.live} canlı · ${Math.max(0,(stats?.todayJobCount??0)-kpis.done-kpis.live)} kalan`,
                        delta: '—',
                    },
                    {
                        label: 'Tamamlanan',
                        value: isLoading ? null : kpis.done,
                        sub: isLoading ? '—' : `${kpis.cancelled} iptal · ${kpis.live} devam ediyor`,
                        delta: '—',
                    },
                    {
                        label: 'Aktif Araç',
                        value: isLoading ? null : `${stats?.activeVehicles ?? 0}/${stats?.totalVehicles ?? 0}`,
                        sub: isLoading ? '—' : `${Math.max(0,(stats?.totalVehicles??0)-(stats?.activeVehicles??0))} araç devre dışı`,
                        delta: '—',
                    },
                    {
                        label: 'Toplam Hat',
                        value: isLoading ? null : (stats?.totalRoutes ?? 0),
                        sub: 'Aktif güzergahlar',
                        delta: '—',
                    },
                ].map((c, i) => (
                    <article key={i} className="rp-kpi">
                        <div className="rp-kpi-head">
                            <span className="rp-kpi-label">{c.label}</span>
                            <span className="rp-kpi-delta">{c.delta}</span>
                        </div>
                        <div className="rp-kpi-row">
                            {c.value === null
                                ? <Skeleton style={{ height: 36, width: 64 }} />
                                : <div className="rp-kpi-value">{c.value}</div>}
                        </div>
                        <div className="rp-kpi-sub">{c.sub}</div>
                    </article>
                ))}
            </section>

            {/* Hero: Leaflet Harita + Canlı Seferler + Uyarılar */}
            <HeroSection routes={routes} liveJobs={liveJobs} />

            {/* Zaman Çizelgesi */}
            <TimelineCard jobs={todayJobs} onSelect={setSelectedJob} />

            {/* Seferler Tablosu */}
            {isLoading ? (
                <article className="rp-card">
                    <div className="rp-card-head"><div><h2 className="rp-card-title">Seferler</h2></div></div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1,2,3].map(i => <Skeleton key={i} style={{ height: 40, borderRadius: 8, width: i === 3 ? '75%' : '100%' }} />)}
                    </div>
                </article>
            ) : (
                <TripsTable
                    jobs={todayJobs.length > 0 ? todayJobs : (stats?.upcomingJobs ?? [])}
                    onSelect={setSelectedJob}
                />
            )}

            <JobDetailModal
                job={selectedJob}
                open={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                onCompleted={onCompleted}
            />
        </>
    );
}
