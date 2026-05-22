'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getReportSummary, getTimeline, getRouteStats, Period, ReportSummary, TimelineItem, RouteStat } from '@/lib/reports';

// ── Sparkline ────────────────────────────────────────
function Sparkline({ data, color = '#0d9488' }: { data: number[]; color?: string }) {
    if (data.length < 2) return <div style={{ height: 28 }} />;
    const max = Math.max(...data, 1), min = Math.min(...data);
    const r = max - min || 1;
    const W = 80, H = 28;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / r) * (H - 4) + 2}`).join(' ');
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ── Delta ────────────────────────────────────────────
function Delta({ v, invert = false }: { v: number | null; invert?: boolean }) {
    if (v === null) return null;
    const good = invert ? v < 0 : v > 0;
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: good ? '#dcfce7' : '#fef9c3', color: good ? '#15803d' : '#a16207' }}>
            {v > 0 ? '+' : ''}{v}%
        </span>
    );
}

// ── KPI Card ─────────────────────────────────────────
function KpiCard({ label, value, sub, delta, invert, spark }: {
    label: string; value: string; sub?: string; delta: number | null; invert?: boolean; spark: number[];
}) {
    const good = delta === null ? true : invert ? delta < 0 : delta > 0;
    return (
        <div className="rp-card" style={{ padding: '16px 18px', flex: 1, minWidth: 130 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{label}</span>
                <Delta v={delta} invert={invert} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>}
            <div style={{ marginTop: 8 }}>
                <Sparkline data={spark} color={good ? '#0d9488' : '#d97706'} />
            </div>
        </div>
    );
}

// ── Grouped Bar Chart (SVG) — real timeline totals ─────
function GroupedBarChart({ data }: { data: TimelineItem[] }) {
    const slice = data.slice(-7);
    if (!slice.length) return (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Veri yok</div>
    );

    const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const series = slice.map((d, i) => ({
        label: DAYS_TR[new Date(d.date).getDay() === 0 ? 6 : new Date(d.date).getDay() - 1] ?? d.date.substring(5),
        completed: d.completed,
        other: d.total - d.completed,
    }));
    const maxVal = Math.max(...series.map(s => s.completed + s.other), 1);

    const W = 500, H = 180, padL = 32, padB = 22, groupW = 48, barW = 20;
    const totalGroups = series.length;
    const groupSpacing = (W - padL - totalGroups * groupW) / (totalGroups + 1);
    const yMax = Math.ceil(maxVal / 5) * 5 || 5;
    const yTicks = Array.from({ length: Math.min(6, yMax / 5 + 1) }, (_, i) => i * Math.ceil(yMax / 5));

    return (
        <svg viewBox={`0 0 ${W} ${H + padB}`} width="100%" style={{ overflow: 'visible' }}>
            {yTicks.map(t => {
                const y = H - (t / yMax) * H;
                return (
                    <g key={t}>
                        <line x1={padL} x2={W} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
                        <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={10} fill="var(--ink-3)">{t}</text>
                    </g>
                );
            })}
            {series.map((s, i) => {
                const gx = padL + groupSpacing + i * (groupW + groupSpacing);
                const compH = (s.completed / yMax) * H;
                const othH = (s.other / yMax) * H;
                return (
                    <g key={i}>
                        <rect x={gx} y={H - compH} width={barW} height={compH} fill="#0f172a" rx={2} />
                        <rect x={gx + barW + 2} y={H - othH} width={barW} height={othH} fill="#dc2626" rx={2} />
                        <text x={gx + barW + 1} y={H + padB - 4} textAnchor="middle" fontSize={10} fill="var(--ink-3)">{s.label}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ── Heatmap — saatlik veri yoksa bilgi göster ─────────
function Heatmap({ data }: { data: TimelineItem[] }) {
    const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

    // Gerçek günlük toplam verisini saatlere dağıt (iş saati ağırlıklı)
    const hourWeights: Record<number, number> = {
        7: 0.4, 8: 1.0, 9: 0.9, 10: 0.6, 11: 0.5, 12: 0.55,
        13: 0.5, 14: 0.5, 15: 0.55, 16: 0.7, 17: 1.0, 18: 0.85, 19: 0.3,
    };
    const totalWeight = Object.values(hourWeights).reduce((a, b) => a + b, 0);

    const slice = data.slice(-7);

    function getDensity(dayIdx: number, hour: number): number {
        const d = slice[dayIdx];
        if (!d || d.total === 0) return 0;
        const w = hourWeights[hour] ?? 0;
        const dailyMax = Math.max(...slice.map(x => x.total), 1);
        return Math.min(0.9, (d.total / dailyMax) * (w / totalWeight) * totalWeight * 0.5);
    }

    const cellW = 32, cellH = 20, padL = 30, padT = 18;
    const W = padL + HOURS.length * cellW + 4;
    const H = padT + 7 * cellH + 4;

    const hasData = slice.some(d => d.total > 0);

    return (
        <div>
            {!hasData && (
                <div style={{ color: 'var(--ink-3)', fontSize: 12, marginBottom: 8 }}>
                    Henüz sefer verisi yok — heatmap gerçek verileri yansıtır.
                </div>
            )}
            <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" style={{ overflow: 'visible' }}>
                {HOURS.map((h, i) => (
                    <text key={h} x={padL + i * cellW + cellW / 2} y={13} textAnchor="middle" fontSize={9} fill="var(--ink-3)">
                        {String(h).padStart(2, '0')}
                    </text>
                ))}
                {DAYS.map((d, di) => (
                    <g key={d}>
                        <text x={padL - 4} y={padT + di * cellH + cellH / 2 + 4} textAnchor="end" fontSize={10} fill="var(--ink-3)">{d}</text>
                        {HOURS.map((h) => {
                            const v = getDensity(di, h);
                            return (
                                <rect key={h}
                                    x={padL + (h - 7) * cellW + 1} y={padT + di * cellH + 1}
                                    width={cellW - 2} height={cellH - 2}
                                    fill={v > 0 ? `rgba(13,148,136,${v.toFixed(2)})` : 'var(--bg-2)'}
                                    rx={3}
                                />
                            );
                        })}
                    </g>
                ))}
                <g transform={`translate(${padL},${padT + 7 * cellH + 8})`}>
                    <text x={0} y={10} fontSize={9} fill="var(--ink-3)">Az</text>
                    {[0.08, 0.25, 0.4, 0.6, 0.8].map((v, i) => (
                        <rect key={i} x={20 + i * 13} y={2} width={11} height={10} fill={`rgba(13,148,136,${v})`} rx={2} />
                    ))}
                    <text x={89} y={10} fontSize={9} fill="var(--ink-3)">Yoğun</text>
                </g>
            </svg>
        </div>
    );
}

// ── Ring Performansı — gerçek tamamlanma oranı ────────
function RingPerf({ routes }: { routes: RouteStat[] }) {
    if (!routes.length) return <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Veri yok</div>;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {routes.slice(0, 5).map(r => {
                const zamanlilik = r.jobCount > 0 ? Math.round((r.completedCount / r.jobCount) * 100) : 0;
                const ringColor = r.color ?? r.ringType?.color ?? '#0d9488';
                return (
                    <div key={r.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ringColor, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{r.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{r.jobCount} sefer</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <PRow label="Zamanlılık" value={zamanlilik} color="#16a34a" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function PRow({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 72, flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: 6, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>%{value}</span>
        </div>
    );
}

// ── Top Stops — API desteklenmiyor ────────────────────
function TopStops() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--ink-3)' }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
                Durak istatistikleri henüz toplanmıyor.
            </span>
        </div>
    );
}

// ── Period helpers ─────────────────────────────────────
type PLabel = 'Bugün' | 'Bu hafta' | 'Bu ay' | 'Bu çeyrek';

function getPeriodParams(label: PLabel): { period: Period; from?: string; to?: string } {
    if (label === 'Bugün') {
        const d = new Date();
        const fmt = (dt: Date) => dt.toISOString().split('T')[0]!;
        return { period: 'custom', from: fmt(d), to: fmt(d) };
    }
    if (label === 'Bu hafta') return { period: 'week' };
    if (label === 'Bu ay')    return { period: 'month' };
    return { period: '3months' };
}

// ── Page ───────────────────────────────────────────────
export default function ReportsPage() {
    const [plabel, setPlabel] = useState<PLabel>('Bu hafta');
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [routes, setRoutes] = useState<RouteStat[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { period, from, to } = getPeriodParams(plabel);
            const [s, t, r] = await Promise.all([
                getReportSummary(period, from, to),
                getTimeline(period, from, to),
                getRouteStats(period, from, to),
            ]);
            setSummary(s); setTimeline(t); setRoutes(r);
        } catch { toast.error('Raporlar yüklenemedi'); }
        finally { setLoading(false); }
    }, [plabel]);

    useEffect(() => { load(); }, [load]);

    // Sparklines from real timeline data
    const spark = (fn: (d: TimelineItem) => number) => timeline.slice(-7).map(fn);

    const PLABELS: PLabel[] = ['Bugün', 'Bu hafta', 'Bu ay', 'Bu çeyrek'];

    return (
        <div style={{ padding: '4px 0' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Raporlar</h1>
                    <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '5px 0 0' }}>
                        Operasyonel performansı zaman aralığında karşılaştır, anomalileri yakala.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-2)', borderRadius: 10, padding: 3, gap: 2 }}>
                        {PLABELS.map(l => (
                            <button key={l} onClick={() => setPlabel(l)}
                                style={{
                                    padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: plabel === l ? 'var(--surface)' : 'transparent',
                                    color: plabel === l ? 'var(--ink)' : 'var(--ink-3)',
                                    fontSize: 13, fontWeight: plabel === l ? 600 : 400,
                                    boxShadow: plabel === l ? '0 1px 4px rgba(15,23,42,.08)' : 'none',
                                    transition: 'all .15s', whiteSpace: 'nowrap',
                                }}>{l}</button>
                        ))}
                    </div>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--ink-2)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Dışa aktar
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: 56, textAlign: 'center', color: 'var(--ink-3)' }}>Yükleniyor…</div>
            ) : (
                <>
                    {/* KPI Strip */}
                    {summary && (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                            <KpiCard
                                label="Toplam Sefer"
                                value={summary.totalJobs.toLocaleString('tr-TR')}
                                sub={plabel}
                                delta={null}
                                spark={spark(d => d.total)}
                            />
                            <KpiCard
                                label="Tamamlanan"
                                value={summary.completedJobs.toLocaleString('tr-TR')}
                                sub={plabel}
                                delta={null}
                                spark={spark(d => d.completed)}
                            />
                            <KpiCard
                                label="Ort. Doluluk"
                                value={summary.avgOccupancy > 0 ? `%${summary.avgOccupancy}` : '—'}
                                sub={plabel}
                                delta={null}
                                spark={spark(() => summary.avgOccupancy)}
                            />
                            <KpiCard
                                label="Zamanlılık"
                                value={`%${summary.completionRate}`}
                                sub={plabel}
                                delta={null}
                                spark={spark(d => d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0)}
                            />
                            <KpiCard
                                label="Aktif Araç"
                                value={summary.activeVehicles.toLocaleString('tr-TR')}
                                sub="Toplam aktif"
                                delta={null}
                                spark={spark(() => summary.activeVehicles)}
                            />
                            <KpiCard
                                label="Aktif Sürücü"
                                value={summary.activeDrivers.toLocaleString('tr-TR')}
                                sub="Toplam aktif"
                                delta={null}
                                spark={spark(() => summary.activeDrivers)}
                            />
                        </div>
                    )}

                    {/* Charts row 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="rp-card" style={{ padding: '20px 20px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Günlük Sefer Hacmi</div>
                                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Son 7 gün · tamamlanan ve diğer</div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {[{ c: '#0f172a', l: 'Tamamlanan' }, { c: '#dc2626', l: 'Diğer' }].map(x => (
                                        <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-2)' }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: x.c, flexShrink: 0 }} />{x.l}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <GroupedBarChart data={timeline} />
                        </div>
                        <div className="rp-card" style={{ padding: '20px 20px 16px' }}>
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Saat Bazlı Yoğunluk</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Günlük toplama göre tahmini dağılım</div>
                            </div>
                            <Heatmap data={timeline} />
                        </div>
                    </div>

                    {/* Charts row 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="rp-card" style={{ padding: '20px' }}>
                            <div style={{ marginBottom: 18 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Ring Performansı</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Zamanlılık karşılaştırması (tamamlanma oranı)</div>
                            </div>
                            <RingPerf routes={routes} />
                        </div>
                        <div className="rp-card" style={{ padding: '20px' }}>
                            <div style={{ marginBottom: 18 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>En Çok Kullanılan Duraklar</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Bu hafta · günlük ortalama yolcu</div>
                            </div>
                            <TopStops />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
