'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import { getActivityLogs, ActivityLog } from '@/lib/activity';

type ActionFilter = 'tumu'|'create'|'update'|'delete'|'system';

// ── Icon types ──────────────────────────────────────────────────
const ICONS: Record<string, { color:string; bg:string; node:ReactNode }> = {
    create: {
        color:'#15803d', bg:'#dcfce7',
        node:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
    },
    update: {
        color:'#1d4ed8', bg:'#dbeafe',
        node:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    delete: {
        color:'#dc2626', bg:'#fee2e2',
        node:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    cancel: {
        color:'#d97706', bg:'#fef9c3',
        node:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
    },
    system: {
        color:'#d97706', bg:'#fef9c3',
        node:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    apply: {
        color:'#15803d', bg:'#dcfce7',
        node:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    invite: {
        color:'#1d4ed8', bg:'#dbeafe',
        node:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
};

function getIcon(action: string) {
    const a = action.toUpperCase();
    if (a.includes('DELETE') || a.includes('SİL')) return ICONS['delete']!;
    if (a.includes('CANCEL') || a.includes('İPTAL')) return ICONS['cancel']!;
    if (a.includes('SYSTEM') || a.includes('ALERT') || a.includes('UYARI')) return ICONS['system']!;
    if (a.includes('APPLY') || a.includes('UYGULA')) return ICONS['apply']!;
    if (a.includes('INVITE') || a.includes('DAVET')) return ICONS['invite']!;
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('GÜNCELLE') || a.includes('DEĞIŞ')) return ICONS['update']!;
    return ICONS['create']!;
}

const ENTITY_LABELS: Record<string,string> = {
    job:'sefer', route:'hat', vehicle:'araç', driver:'sürücü',
    user:'kullanıcı', template:'şablon', stop:'durak', ring_type:'ring tipi',
};

function actionVerb(action: string, entity: string): string {
    const a = action.toUpperCase();
    const e = ENTITY_LABELS[entity] ?? entity;
    if (a.includes('DELETE')) return `${e} sildi`;
    if (a.includes('CANCEL')) return `seferi iptal etti`;
    if (a.includes('SYSTEM') || a.includes('ALERT')) return 'otomatik uyarı oluşturdu';
    if (a.includes('APPLY')) return 'şablonu takvime uyguladı';
    if (a.includes('INVITE')) return 'kullanıcı davet etti';
    if (a.includes('UPDATE') || a.includes('EDIT')) return `${e} güncelledi`;
    if (a.includes('ADD') || a.includes('EKLE')) return `yeni ${e} ekledi`;
    return `yeni ${e} oluşturdu`;
}

// Deterministic detail text
function detailText(log: ActivityLog): string | null {
    if (!log.entityId) return null;
    const e = log.entity;
    if (e === 'job') return `Araç · ${log.entityId.slice(0,6)}`;
    if (e === 'route' || e === 'template') return `"${log.entityId.slice(0,8)}"`;
    if (e === 'driver') return `Sürücü · ${log.entityId.slice(0,6)}`;
    return `${ENTITY_LABELS[e] ?? e} · ${log.entityId.slice(0,8)}`;
}

// Role → avatar color
function avatarColor(role: string) {
    if (role === 'ADMIN' || role === 'MANAGER') return '#7c3aed';
    if (role === 'OPERATOR') return '#0d9488';
    return '#64748b';
}

// Group logs by date
function groupByDate(logs: ActivityLog[]) {
    const groups: { label: string; items: ActivityLog[] }[] = [];
    const seen = new Map<string, number>();
    for (const log of logs) {
        const key = new Date(log.createdAt).toDateString();
        if (seen.has(key)) {
            groups[seen.get(key)!]!.items.push(log);
        } else {
            const d = new Date(log.createdAt);
            const today = new Date();
            const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
            let label = d.toDateString() === today.toDateString() ? 'BUGÜN'
                : d.toDateString() === yesterday.toDateString() ? 'DÜN'
                : d.toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric' }).toUpperCase();
            seen.set(key, groups.length);
            groups.push({ label, items: [log] });
        }
    }
    return groups;
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
}

// ── MOCK DATA (shown when API is empty) ──────────────────────
const MOCK_LOGS: ActivityLog[] = [
    { id:1, action:'CREATE_JOB', entity:'job', entityId:'06rp002', meta:null, createdAt: (() => { const d=new Date(); d.setHours(10,14); return d.toISOString(); })(), user:{id:'u1',username:'Ali Demir',role:'ADMIN'} },
    { id:2, action:'CANCEL_JOB', entity:'job', entityId:'08siyah', meta:null, createdAt: (() => { const d=new Date(); d.setHours(10,8); return d.toISOString(); })(), user:{id:'u2',username:'Zeynep Kara',role:'OPERATOR'} },
    { id:3, action:'SYSTEM_ALERT', entity:'vehicle', entityId:'06rp004', meta:null, createdAt: (() => { const d=new Date(); d.setHours(9,52); return d.toISOString(); })(), user:{id:'sys',username:'Sistem',role:'SYSTEM'} },
    { id:4, action:'UPDATE_DRIVER', entity:'driver', entityId:'selimyildiz', meta:null, createdAt: (() => { const d=new Date(); d.setHours(9,30); return d.toISOString(); })(), user:{id:'u3',username:'Murat Şahin',role:'OPERATOR'} },
    { id:5, action:'APPLY_TEMPLATE', entity:'template', entityId:'haftaici-sabah', meta:null, createdAt: (() => { const d=new Date(); d.setHours(9,12); return d.toISOString(); })(), user:{id:'u1',username:'Ali Demir',role:'ADMIN'} },
    { id:6, action:'CREATE_STOP', entity:'stop', entityId:'bahcelievler-mah', meta:null, createdAt: (() => { const d=new Date(); d.setHours(8,47); return d.toISOString(); })(), user:{id:'u2',username:'Zeynep Kara',role:'OPERATOR'} },
];
const MOCK_YESTERDAY: ActivityLog[] = [
    { id:7, action:'INVITE_USER', entity:'user', entityId:'tolga-aksoy', meta:null, createdAt: (() => { const d=new Date(); d.setDate(d.getDate()-1); d.setHours(18,22); return d.toISOString(); })(), user:{id:'u1',username:'Ali Demir',role:'ADMIN'} },
    { id:8, action:'UPDATE_ROUTE', entity:'route', entityId:'kirmizi-ring', meta:null, createdAt: (() => { const d=new Date(); d.setDate(d.getDate()-1); d.setHours(17,40); return d.toISOString(); })(), user:{id:'u4',username:'Pınar Doğan',role:'OPERATOR'} },
    { id:9, action:'SYSTEM_ALERT', entity:'vehicle', entityId:'06rp005', meta:null, createdAt: (() => { const d=new Date(); d.setDate(d.getDate()-1); d.setHours(16,18); return d.toISOString(); })(), user:{id:'sys',username:'Sistem',role:'SYSTEM'} },
    { id:10, action:'DELETE_TEMPLATE', entity:'template', entityId:'eski-haftasonu-plani', meta:null, createdAt: (() => { const d=new Date(); d.setDate(d.getDate()-1); d.setHours(14,5); return d.toISOString(); })(), user:{id:'u3',username:'Murat Şahin',role:'OPERATOR'} },
];

const MOCK_DETAILS: Record<number,string> = {
    1:'06 RP 002 · 10:30 · Siyah Ring',
    2:'08:30 Siyah Ring · sebep: Araç bakımda',
    3:'06 RP 004 trafik nedeniyle gecikti · 8 dk',
    4:'Selim Yıldız → vardiya: Sabah → Akşam',
    5:'"Hafta içi sabah" · 18 sefer · 11–15 May',
    6:'Bahçelievler Mah. · Söğütözü hattına bağlandı',
    7:'Tolga Aksoy · rol: Görüntüleyici',
    8:'Kırmızı Ring · 7 durak → 8 durak',
    9:'06 RP 005 · %18 yakıt seviyesi',
    10:'"Eski hafta sonu planı" · oluşturma: 2 ay önce',
};

// ── Page ────────────────────────────────────────────────────────
const FILTER_TABS: { key:ActionFilter; label:string }[] = [
    { key:'tumu',   label:'Tümü' },
    { key:'create', label:'Oluşturma' },
    { key:'update', label:'Düzenleme' },
    { key:'delete', label:'Silme' },
    { key:'system', label:'Sistem' },
];

export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActionFilter>('tumu');
    const limit = 100;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getActivityLogs({ page, limit });
            if (res.data.length > 0) { setLogs(res.data); setTotal(res.total); }
            else { setLogs([...MOCK_LOGS, ...MOCK_YESTERDAY]); setTotal(MOCK_LOGS.length + MOCK_YESTERDAY.length); }
        } catch { setLogs([...MOCK_LOGS, ...MOCK_YESTERDAY]); setTotal(MOCK_LOGS.length + MOCK_YESTERDAY.length); }
        finally { setLoading(false); }
    }, [page]);
    useEffect(() => { load(); }, [load]);

    const filtered = logs.filter(log => {
        if (filter === 'tumu') return true;
        const a = log.action.toUpperCase();
        if (filter === 'create') return a.includes('CREATE') || a.includes('ADD');
        if (filter === 'update') return a.includes('UPDATE') || a.includes('EDIT') || a.includes('APPLY');
        if (filter === 'delete') return a.includes('DELETE') || a.includes('CANCEL');
        if (filter === 'system') return a.includes('SYSTEM') || a.includes('ALERT');
        return true;
    });

    const groups = groupByDate(filtered);
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="rp" style={{ padding:'28px 32px' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:22, fontWeight:700, color:'var(--ink)', margin:0 }}>Aktivite Geçmişi</h1>
                    <p style={{ fontSize:13, color:'var(--ink-3)', margin:'5px 0 0' }}>
                        Kullanıcı eylemlerini ve sistem olaylarını kronolojik olarak takip et.
                    </p>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ display:'flex', background:'var(--bg-2)', borderRadius:10, padding:3, gap:2 }}>
                        {FILTER_TABS.map(t => (
                            <button key={t.key} onClick={() => setFilter(t.key)}
                                style={{
                                    padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer',
                                    background: filter === t.key ? 'var(--surface)' : 'transparent',
                                    color: filter === t.key ? 'var(--ink)' : 'var(--ink-3)',
                                    fontSize:13, fontWeight: filter === t.key ? 600 : 400,
                                    boxShadow: filter === t.key ? '0 1px 4px rgba(15,23,42,.08)' : 'none',
                                    transition:'all .15s', whiteSpace:'nowrap',
                                }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <button className="rp-btn" style={{ display:'flex', alignItems:'center', gap:6, height:36 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Dışa aktar
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="rp-card" style={{ padding:56, textAlign:'center', color:'var(--ink-3)' }}>Yükleniyor…</div>
            ) : groups.length === 0 ? (
                <div className="rp-card" style={{ padding:56, textAlign:'center', color:'var(--ink-3)' }}>Aktivite bulunamadı</div>
            ) : (
                <div className="rp-card" style={{ padding:'8px 0 4px' }}>
                    {groups.map((group, gi) => (
                        <div key={group.label}>
                            {/* Date header */}
                            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 24px 8px' }}>
                                <span style={{ fontSize:11, fontWeight:700, color:'var(--ink-3)', letterSpacing:1 }}>{group.label}</span>
                                <span style={{ fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:99, background:'var(--bg-2)', color:'var(--ink-3)' }}>
                                    {group.items.length} olay
                                </span>
                                <div style={{ flex:1, height:1, background:'var(--border)' }} />
                            </div>

                            {/* Events */}
                            <div style={{ padding:'0 24px 8px' }}>
                                {group.items.map((log, i) => {
                                    const icon = getIcon(log.action);
                                    const verb = actionVerb(log.action, log.entity);
                                    const detail = MOCK_DETAILS[log.id] ?? detailText(log);
                                    const isLast = i === group.items.length - 1 && gi === groups.length - 1;
                                    const isSystem = log.user.username === 'Sistem' || log.user.role === 'SYSTEM';
                                    const avColor = isSystem ? '#94a3b8' : avatarColor(log.user.role);

                                    return (
                                        <div key={log.id} style={{ display:'flex', gap:0 }}>
                                            {/* Left rail */}
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:44, flexShrink:0, paddingTop:10 }}>
                                                <div style={{ width:28, height:28, borderRadius:'50%', background:icon.bg, color:icon.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                    {icon.node}
                                                </div>
                                                {!isLast && (
                                                    <div style={{ width:1, flex:1, minHeight:8, background:'var(--border)', margin:'3px 0' }} />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex:1, paddingTop:10, paddingBottom: isLast ? 4 : 0, paddingLeft:6, paddingRight:8 }}>
                                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                    {/* User mini avatar */}
                                                    <div style={{ width:22, height:22, borderRadius:'50%', background:avColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>
                                                        {isSystem ? '·' : log.user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)', whiteSpace:'nowrap' }}>{log.user.username}</span>
                                                    <span style={{ fontSize:13, color:'var(--ink-2)' }}>{verb}</span>
                                                    <span style={{ marginLeft:'auto', fontSize:12, color:'var(--ink-3)', fontVariantNumeric:'tabular-nums', flexShrink:0, paddingLeft:16 }}>
                                                        {fmtTime(log.createdAt)}
                                                    </span>
                                                </div>
                                                {detail && (
                                                    <div style={{ marginTop:5, marginBottom:6, marginLeft:30 }}>
                                                        <span style={{ fontSize:12, color:'var(--ink-2)', background:'var(--bg-2)', borderRadius:6, padding:'4px 10px', display:'inline-block' }}>
                                                            {detail}
                                                        </span>
                                                    </div>
                                                )}
                                                {!detail && <div style={{ height:8 }} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div style={{ display:'flex', gap:8, justifyContent:'center', padding:'12px 24px', borderTop:'1px solid var(--border)' }}>
                            <button className="rp-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Önceki</button>
                            <span style={{ lineHeight:'32px', fontSize:13, color:'var(--ink-2)', padding:'0 8px' }}>{page} / {totalPages}</span>
                            <button className="rp-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Sonraki →</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
