'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getDriver, DriverDetail } from '@/lib/drivers';
import DriverDialog from '../driver-dialog';

const STATUS_LABEL: Record<string, string> = {
    COMPLETED: 'Tamamlandı', CANCELLED: 'İptal', PENDING: 'Bekliyor', IN_PROGRESS: 'Devam'
};
const STATUS_COLOR: Record<string, string> = {
    COMPLETED: 'var(--ok)', CANCELLED: 'var(--danger)', PENDING: 'var(--warn)', IN_PROGRESS: 'var(--accent)'
};

export default function DriverDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [driver, setDriver] = useState<DriverDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);

    const load = useCallback(() => {
        getDriver(id)
            .then(setDriver)
            .catch(() => toast.error('Sürücü yüklenemedi'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}>Yükleniyor...</div>;
    if (!driver) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}>Sürücü bulunamadı</div>;

    const licenseExpiry = driver.licenseExpiry ? new Date(driver.licenseExpiry) : null;
    const daysToExpiry = driver.daysToExpiry;
    const licenseStatus = daysToExpiry == null ? null : daysToExpiry < 0 ? 'expired' : daysToExpiry <= 30 ? 'warn' : 'ok';

    return (
        <div style={{ maxWidth: 900 }}>
            {/* Üst bar: geri + başlık + düzenle butonu */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <button onClick={() => router.back()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', fontSize: 13, padding: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sürücülere Dön
                </button>
                <button
                    onClick={() => setEditOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingLeft: 14, paddingRight: 16, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sürücüyü Düzenle
                </button>
            </div>

            {/* Profil başlık */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>{driver.name}</h1>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: driver.isActive ? '#dcfce7' : 'var(--bg-2)', color: driver.isActive ? '#15803d' : 'var(--ink-3)', fontWeight: 600 }}>
                            {driver.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                        {driver.licenseType && (
                            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-2)', color: 'var(--ink-2)', fontWeight: 600 }}>
                                Ehliyet {driver.licenseType}
                            </span>
                        )}
                        {licenseStatus === 'expired' && (
                            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'var(--danger)', color: '#fff', fontWeight: 600 }}>Ehliyet Süresi Geçmiş</span>
                        )}
                        {licenseStatus === 'warn' && (
                            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#fef9c3', color: '#a16207', fontWeight: 600 }}>{daysToExpiry} gün kaldı</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Kişisel Bilgiler */}
                <div className="rp-card" style={{ padding: 20, gridColumn: '1 / 2' }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6, margin: '0 0 14px' }}>Kişisel Bilgiler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Row label="Telefon" value={driver.phone ?? '—'} />
                        <Row label="Adres" value={driver.address ?? '—'} />
                        <Row label="Ehliyet Tipi" value={driver.licenseType ?? '—'} />
                        <Row label="Ehliyet Bitiş" value={licenseExpiry ? licenseExpiry.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
                        {driver.notes && <Row label="Notlar" value={driver.notes} />}
                    </div>
                </div>

                {/* İstatistikler */}
                <div className="rp-card" style={{ padding: 20, gridColumn: '2 / 4' }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6, margin: '0 0 14px' }}>İstatistikler</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <Stat label="Toplam Sefer" value={String(driver.totalJobCount ?? 0)} />
                        <Stat label="Atanmış Araç" value={String(driver.vehicles.length)} />
                    </div>
                    {driver.vehicles.length > 0 && (
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Araçlar</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {driver.vehicles.map(v => (
                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
                                            <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v9H4zM4 11h16M8 16v2M16 16v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{v.plate}</span>
                                        <span style={{ color: 'var(--ink-3)' }}>—</span>
                                        <span style={{ color: 'var(--ink-2)' }}>{v.brand} {v.model}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Son Seferler */}
            <div className="rp-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Son Seferler</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{driver.recentJobs.length} kayıt</div>
                </div>
                {driver.recentJobs.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Henüz sefer yok</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                                {['TARİH / SAAT', 'HAT', 'RİNG TİPİ', 'ARAÇ', 'DURUM'].map((h, i) => (
                                    <th key={i} style={{ padding: '9px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: .6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {driver.recentJobs.map(j => (
                                <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '11px 20px', fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                                        {new Date(j.dueTime).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '11px 20px', fontSize: 13, color: 'var(--ink)' }}>{j.route?.name ?? '—'}</td>
                                    <td style={{ padding: '11px 20px' }}>
                                        {j.route?.ringType ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: j.route.ringType.color, flexShrink: 0 }} />
                                                {j.route.ringType.name}
                                            </span>
                                        ) : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '11px 20px', fontSize: 13, color: 'var(--ink-2)' }}>{j.vehicle?.plate ?? '—'}</td>
                                    <td style={{ padding: '11px 20px' }}>
                                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: STATUS_COLOR[j.status] ?? 'var(--ink-3)', color: '#fff', fontWeight: 600 }}>
                                            {STATUS_LABEL[j.status] ?? j.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <DriverDialog
                open={editOpen}
                driver={driver}
                onClose={() => setEditOpen(false)}
                onSaved={() => { setEditOpen(false); load(); }}
            />
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 100, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: 'var(--ink)' }}>{value}</span>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{label}</div>
        </div>
    );
}
