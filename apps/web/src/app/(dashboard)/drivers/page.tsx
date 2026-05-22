'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getDrivers, deleteDriver, Driver } from '@/lib/drivers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import DriverDialog from './driver-dialog';

type StatusFilter = 'tumu' | 'gorevde' | 'izinli' | 'raporlu';

function getDriverStatus(d: Driver): 'Görevde' | 'İzinli' | 'Raporlu' {
    if (!d.isActive) return 'İzinli';
    if (d.vehicles.length > 0 && (d.todayJobCount ?? 0) > 0) return 'Görevde';
    if (d.vehicles.length > 0) return 'Görevde';
    return 'İzinli';
}

function Stars({ rating }: { rating: number | null }) {
    if (rating === null) return <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>—</span>;
    const full = Math.round(rating);
    return (
        <span style={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        fill={i <= full ? '#f59e0b' : '#e2e8f0'} />
                </svg>
            ))}
        </span>
    );
}

function VardiyaPill({ v }: { v: string | null }) {
    if (!v) return <span style={{ color: 'var(--ink-3)', fontSize: 15, letterSpacing: 1 }}>—</span>;
    if (v === 'Sabah') return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>Sabah</span>;
    if (v === 'Akşam') return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8' }}>Akşam</span>;
    return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--bg-2)', color: 'var(--ink-3)' }}>Yedek</span>;
}

function DurumPill({ d }: { d: 'Görevde' | 'İzinli' | 'Raporlu' }) {
    if (d === 'Görevde') return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0, animation: 'drv-pulse 2s infinite' }} />
            Görevde
        </span>
    );
    if (d === 'Raporlu') return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#fef9c3', color: '#a16207' }}>Raporlu</span>;
    return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--bg-2)', color: 'var(--ink-3)' }}>İzinli</span>;
}

const BUS_ICON = (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v9H4zM4 11h16M8 16v2M16 16v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

export default function DriversPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<StatusFilter>('tumu');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDriver, setEditDriver] = useState<Driver | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getDrivers({ limit: 200, includeInactive: true });
            setDrivers(res.data);
            setTotal(res.total);
        } catch { toast.error('Sürücüler yüklenemedi'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const withStatus = drivers.map(d => ({ ...d, durum: getDriverStatus(d) }));

    const counts = {
        gorevde: withStatus.filter(d => d.durum === 'Görevde').length,
        izinli: withStatus.filter(d => d.durum === 'İzinli').length,
        raporlu: withStatus.filter(d => d.durum === 'Raporlu').length,
    };

    const visible = withStatus.filter(d => {
        const q = search.toLowerCase();
        const matchSearch = !q || d.name.toLowerCase().includes(q) || d.vehicles.some(v => v.plate.toLowerCase().includes(q));
        const matchFilter =
            filter === 'tumu' ? true :
            filter === 'gorevde' ? d.durum === 'Görevde' :
            filter === 'izinli' ? d.durum === 'İzinli' :
            d.durum === 'Raporlu';
        return matchSearch && matchFilter;
    });

    const TABS: { key: StatusFilter; label: string; count?: number }[] = [
        { key: 'tumu', label: 'Tümü', count: total },
        { key: 'gorevde', label: 'Görevde', count: counts.gorevde },
        { key: 'izinli', label: 'İzinli', count: counts.izinli },
        { key: 'raporlu', label: 'Raporlu', count: counts.raporlu },
    ];

    return (
        <div style={{ padding: '4px 0' }}>
            <style>{`
                @keyframes drv-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
                .drv-row { transition: background .1s; cursor: pointer; }
                .drv-row:hover { background: var(--bg-2); }
                .drv-row .drv-arrow { opacity: 0; transition: opacity .15s; }
                .drv-row:hover .drv-arrow { opacity: 1; }
            `}</style>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>
                <span>Araç Yönetimi</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ color: 'var(--ink)' }}>Sürücüler</span>
            </div>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Sürücüler</h1>
                    <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '5px 0 0' }}>
                        {total} sürücü kayıtlı
                        {counts.gorevde > 0 && <> · <span style={{ color: '#15803d' }}>{counts.gorevde} görevde</span></>}
                        {counts.raporlu > 0 && <> · <span style={{ color: '#a16207' }}>{counts.raporlu} raporlu</span></>}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setFilter(t.key)}
                                style={{
                                    padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
                                    background: filter === t.key ? 'var(--accent)' : 'var(--surface)',
                                    color: filter === t.key ? '#fff' : 'var(--ink-2)',
                                    fontSize: 13, fontWeight: filter === t.key ? 600 : 400,
                                    cursor: 'pointer', transition: 'all .15s',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                {t.label}
                                {t.count !== undefined && (
                                    <span style={{
                                        fontSize: 11, padding: '1px 6px', borderRadius: 99,
                                        background: filter === t.key ? 'rgba(255,255,255,.25)' : 'var(--bg-2)',
                                        color: filter === t.key ? '#fff' : 'var(--ink-3)',
                                    }}>{t.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <button
                        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingLeft: 14, paddingRight: 16, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => { setEditDriver(null); setDialogOpen(true); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                        Sürücü Ekle
                    </button>
                </div>
            </div>

            {/* Table card */}
            <div className="rp-card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Tüm Sürücüler</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{visible.length} kayıt</div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Sürücü ara…"
                            style={{ paddingLeft: 30, paddingRight: 12, height: 32, width: 200, border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg-2)', color: 'var(--ink)', outline: 'none' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 56, textAlign: 'center', color: 'var(--ink-3)' }}>Yükleniyor…</div>
                ) : visible.length === 0 ? (
                    <div style={{ padding: 56, textAlign: 'center', color: 'var(--ink-3)' }}>Sürücü bulunamadı</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                                {['SÜRÜCÜ', 'ATANMIŞ ARAÇ', 'VARDİYA', 'PERFORMANS', 'SEFER / SAAT', 'DURUM', ''].map((h, i) => (
                                    <th key={i} style={{ padding: '9px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: .6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map(d => (
                                <tr key={d.id} className="drv-row"
                                    style={{ borderBottom: '1px solid var(--border)' }}
                                    onClick={() => router.push(`/drivers/${d.id}`)}>

                                    {/* Sürücü */}
                                    <td style={{ padding: '13px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                {d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{d.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                                                    {d.phone ?? ''}
                                                    {d.licenseType && <>{d.phone ? ' · ' : ''}{d.licenseType} / Yolcu</>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Araç */}
                                    <td style={{ padding: '13px 20px' }}>
                                        {d.vehicles.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                {d.vehicles.map(v => (
                                                    <span key={v.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
                                                        <span style={{ color: 'var(--ink-3)' }}>{BUS_ICON}</span>
                                                        {v.plate}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : <span style={{ color: 'var(--ink-3)', fontSize: 15, letterSpacing: 1 }}>—</span>}
                                    </td>

                                    {/* Vardiya — API'de veri yok */}
                                    <td style={{ padding: '13px 20px' }}>
                                        <VardiyaPill v={null} />
                                    </td>

                                    {/* Performans — API'de veri yok */}
                                    <td style={{ padding: '13px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Stars rating={null} />
                                        </div>
                                    </td>

                                    {/* Sefer / Saat */}
                                    <td style={{ padding: '13px 20px' }}>
                                        {(d.totalJobCount ?? 0) > 0 ? (
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                                                    {(d.totalJobCount ?? 0).toLocaleString('tr-TR')} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)' }}>sefer</span>
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)', marginTop: 1 }}>
                                                    — <span style={{ fontSize: 11 }}>saat</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--ink-3)', fontSize: 15, letterSpacing: 1 }}>—</span>
                                        )}
                                    </td>

                                    {/* Durum */}
                                    <td style={{ padding: '13px 20px' }}>
                                        <DurumPill d={d.durum} />
                                    </td>

                                    {/* Arrow */}
                                    <td style={{ padding: '13px 12px', width: 28 }}>
                                        <svg className="drv-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--ink-3)' }}>
                                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <DriverDialog open={dialogOpen} driver={editDriver} onClose={() => setDialogOpen(false)} onSaved={() => { setDialogOpen(false); load(); }} />

            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sürücüyü Pasife Al</AlertDialogTitle>
                        <AlertDialogDescription>Bu işlem geri alınabilir. Sürücü pasife alınacak.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            if (!deleteId) return;
                            try { await deleteDriver(deleteId); toast.success('Sürücü pasife alındı'); setDeleteId(null); load(); }
                            catch { toast.error('Hata'); }
                        }} style={{ background: 'var(--danger)' }}>Pasife Al</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
