'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getActivityLogs, clearActivityLogs, deleteActivityLog, ActivityLog } from '@/lib/activity';
import { getMe } from '@/lib/auth';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ActionFilter = 'tumu' | 'create' | 'update' | 'delete' | 'system';

interface LogTheme {
    color: string;
    bg: string;
    border: string;
    labelBg: string;
    labelText: string;
    node: ReactNode;
}

// ── Color-coded Action Themes ────────────────────────────────────
const ACTION_THEMES: Record<string, LogTheme> = {
    create: {
        color: '#16a34a', bg: 'rgba(22, 163, 74, 0.03)', border: 'rgba(22, 163, 74, 0.2)',
        labelBg: '#dcfce7', labelText: '#15803d',
        node: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
    },
    update: {
        color: '#ea580c', bg: 'rgba(234, 88, 12, 0.03)', border: 'rgba(234, 88, 12, 0.2)',
        labelBg: '#ffedd5', labelText: '#c2410c',
        node: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    delete: {
        color: '#dc2626', bg: 'rgba(220, 38, 38, 0.03)', border: 'rgba(220, 38, 38, 0.2)',
        labelBg: '#fee2e2', labelText: '#b91c1c',
        node: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    system: {
        color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.03)', border: 'rgba(139, 92, 246, 0.2)',
        labelBg: '#f3e8ff', labelText: '#6d28d9',
        node: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    other: {
        color: '#2563eb', bg: 'rgba(37, 99, 235, 0.03)', border: 'rgba(37, 99, 235, 0.2)',
        labelBg: '#dbeafe', labelText: '#1d4ed8',
        node: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 12h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
    }
};

function getLogTheme(action: string): LogTheme {
    const a = action.toUpperCase();
    if (a.includes('DELETE') || a.includes('SİL') || a.includes('CANCEL') || a.includes('İPTAL')) return ACTION_THEMES['delete']!;
    if (a.includes('SYSTEM') || a.includes('ALERT') || a.includes('UYARI')) return ACTION_THEMES['system']!;
    if (a.includes('CREATE') || a.includes('ADD') || a.includes('EKLE') || a.includes('INVITE') || a.includes('DAVET')) return ACTION_THEMES['create']!;
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('GÜNCELLE') || a.includes('DEĞIŞ') || a.includes('APPLY') || a.includes('UYGULA')) return ACTION_THEMES['update']!;
    return ACTION_THEMES['other']!;
}

const ENTITY_LABELS: Record<string, string> = {
    job: 'sefer',
    route: 'hat',
    vehicle: 'araç',
    driver: 'sürücü',
    user: 'kullanıcı',
    template: 'şablon',
    stop: 'durak',
    ring_type: 'ring tipi',
};

function actionVerb(action: string, entity: string): string {
    const a = action.toUpperCase();
    const e = ENTITY_LABELS[entity] ?? entity;
    if (a.includes('DELETE')) return `${e} kaydını sildi`;
    if (a.includes('CANCEL')) return `seferi iptal etti`;
    if (a.includes('SYSTEM') || a.includes('ALERT')) return 'otomatik sistem uyarısı oluşturdu';
    if (a.includes('APPLY')) return 'şablonu takvime uyguladı';
    if (a.includes('INVITE')) return 'kullanıcıyı davet etti';
    if (a.includes('UPDATE') || a.includes('EDIT')) return `${e} bilgilerini güncelledi`;
    if (a.includes('ADD') || a.includes('EKLE')) return `yeni ${e} ekledi`;
    return `yeni ${e} oluşturdu`;
}

// Generate friendly readable description for system activities
function getFriendlyDescription(log: ActivityLog): { subject: string; verb: string; target?: string } {
    const subject = log.user.username;
    const a = log.action.toUpperCase();
    const e = log.entity;
    
    // Use targetName if stored in meta, otherwise fall back to entityId (sliced if UUID-like)
    let target = log.meta?.targetName || log.entityId || '';
    if (target && !log.meta?.targetName && target.length > 20) {
        target = target.slice(0, 8);
    }

    let verb = '';
    
    if (e === 'user') {
        if (a.includes('DELETE')) {
            verb = 'kullanıcısını sildi';
        } else if (a.includes('CREATE') || a.includes('INVITE')) {
            verb = 'kullanıcısını oluşturdu';
        } else if (a.includes('UPDATE')) {
            verb = 'kullanıcı bilgilerini güncelledi';
        } else {
            verb = 'kullanıcısı üzerinde işlem yaptı';
        }
    } else if (e === 'job') {
        if (a.includes('CANCEL')) {
            verb = 'seferini iptal etti';
        } else if (a.includes('CREATE')) {
            verb = 'yeni sefer oluşturdu';
        } else {
            verb = 'seferini güncelledi';
        }
    } else if (e === 'route') {
        if (a.includes('CREATE')) {
            verb = 'yeni hat oluşturdu';
        } else if (a.includes('DELETE')) {
            verb = 'hattını sildi';
        } else {
            verb = 'hattını güncelledi';
        }
    } else if (e === 'device' || e === 'vehicle') {
        if (a.includes('CREATE')) {
            verb = 'yeni araç ekledi';
        } else if (a.includes('DELETE')) {
            verb = 'aracını sildi';
        } else {
            verb = 'aracını güncelledi';
        }
    } else if (e === 'driver') {
        if (a.includes('CREATE')) {
            verb = 'yeni sürücü ekledi';
        } else if (a.includes('DELETE')) {
            verb = 'sürücüyü sildi';
        } else {
            verb = 'sürücü bilgilerini güncelledi';
        }
    } else if (e === 'template') {
        if (a.includes('APPLY')) {
            verb = 'şablonunu takvime uyguladı';
        } else if (a.includes('CREATE')) {
            verb = 'yeni şablon oluşturdu';
        } else {
            verb = 'şablonunu güncelledi';
        }
    } else if (e === 'stop') {
        if (a.includes('CREATE')) {
            verb = 'yeni durak oluşturdu';
        } else {
            verb = 'durağını güncelledi';
        }
    } else {
        const label = ENTITY_LABELS[e] ?? e;
        if (a.includes('DELETE')) verb = `${label} kaydını sildi`;
        else if (a.includes('CREATE')) verb = `yeni ${label} oluşturdu`;
        else verb = `${label} kaydını güncelledi`;
    }

    return { subject, verb, target };
}

// Helper to construct clear details from metadata or entityId
function detailText(log: ActivityLog): string | null {
    const e = log.entity;
    const label = ENTITY_LABELS[e] ?? e;
    
    if (log.meta) {
        const parts: string[] = [];
        if (log.meta.method && log.meta.path) {
            parts.push(`${log.meta.method} ${log.meta.path}`);
        }
        if (log.meta.status) {
            parts.push(`durum: ${log.meta.status}`);
        }
        if (log.entityId) {
            parts.push(`hedef: ${log.entityId.slice(0, 8)}`);
        }
        return parts.join(' · ');
    }
    
    if (!log.entityId) return null;
    
    if (e === 'job') return `Sefer No · ${log.entityId.slice(0, 6)}`;
    if (e === 'route' || e === 'template') return `"${log.entityId.slice(0, 12)}"`;
    if (e === 'driver') return `Sürücü No · ${log.entityId.slice(0, 6)}`;
    return `${label} · ${log.entityId.slice(0, 12)}`;
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
            const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
            const label = d.toDateString() === today.toDateString() ? 'BUGÜN'
                : d.toDateString() === yesterday.toDateString() ? 'DÜN'
                : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
            seen.set(key, groups.length);
            groups.push({ label, items: [log] });
        }
    }
    return groups;
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

const FILTER_TABS: { key: ActionFilter; label: string }[] = [
    { key: 'tumu', label: 'Tümü' },
    { key: 'create', label: 'Oluşturma' },
    { key: 'update', label: 'Düzenleme' },
    { key: 'delete', label: 'Silme' },
    { key: 'system', label: 'Sistem' },
];

export default function ActivityPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [filter, setFilter] = useState<ActionFilter>('tumu');
    const [searchTerm, setSearchTerm] = useState('');
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const limit = 15; // Max 15 events per page as requested

    // Authenticate client
    useEffect(() => {
        async function fetchMe() {
            setAuthLoading(true);
            try {
                const me = await getMe();
                setCurrentUser(me);
            } catch {
                setCurrentUser(null);
            } finally {
                setAuthLoading(false);
            }
        }
        fetchMe();
    }, []);

    const load = useCallback(async () => {
        if (!currentUser) return;
        
        // Block non-admins
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await getActivityLogs({ page, limit });
            setLogs(res.data);
            setTotal(res.total);
        } catch {
            toast.error('Aktivite geçmişi yüklenirken hata oluştu');
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, currentUser]);

    useEffect(() => {
        load();
    }, [load]);

    // Handle CSV export of real active logs
    const handleExport = useCallback(() => {
        if (logs.length === 0) {
            toast.error('Dışa aktarılacak aktivite kaydı bulunamadı');
            return;
        }

        try {
            const headers = ['ID', 'Kullanici', 'Rol', 'Aksiyon', 'Varlik', 'Varlik ID', 'Tarih'];
            const rows = logs.map(log => [
                log.id,
                log.user.username,
                log.user.role,
                log.action,
                log.entity,
                log.entityId ?? '',
                new Date(log.createdAt).toLocaleString('tr-TR')
            ]);

            const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
                + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `aktivite_gecmisi_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Aktivite geçmişi CSV olarak indirildi');
        } catch {
            toast.error('Dışa aktarma başarısız oldu');
        }
    }, [logs]);

    // Handle Clear Logs
    const handleClearLogs = async () => {
        try {
            await clearActivityLogs();
            toast.success('Tüm aktivite geçmişi başarıyla temizlendi');
            setClearDialogOpen(false);
            setPage(1);
            load();
        } catch {
            toast.error('Geçmiş temizlenirken hata oluştu');
        }
    };

    // Handle single log deletion
    const handleDeleteLog = async (id: number) => {
        try {
            await deleteActivityLog(id);
            toast.success('Aktivite kaydı başarıyla silindi');
            load();
        } catch {
            toast.error('Kayıt silinirken hata oluştu');
        }
    };

    // Filter local display (search and tab)
    const filtered = logs.filter(log => {
        if (filter !== 'tumu') {
            const a = log.action.toUpperCase();
            if (filter === 'create' && !(a.includes('CREATE') || a.includes('ADD'))) return false;
            if (filter === 'update' && !(a.includes('UPDATE') || a.includes('EDIT') || a.includes('APPLY'))) return false;
            if (filter === 'delete' && !(a.includes('DELETE') || a.includes('CANCEL'))) return false;
            if (filter === 'system' && !(a.includes('SYSTEM') || a.includes('ALERT'))) return false;
        }

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            const userMatch = log.user.username.toLowerCase().includes(term);
            const actionMatch = log.action.toLowerCase().includes(term);
            const entityMatch = log.entity.toLowerCase().includes(term);
            const idMatch = log.entityId?.toLowerCase().includes(term) ?? false;
            return userMatch || actionMatch || entityMatch || idMatch;
        }

        return true;
    });

    const groups = groupByDate(filtered);
    const totalPages = Math.ceil(total / limit);

    // Auth state loading
    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-8">
                <div className="text-[var(--ink-3)] font-semibold text-sm">Doğrulanıyor…</div>
            </div>
        );
    }

    // Role Guard: Show a premium Access Denied page for non-administrators
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER')) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 md:p-8">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 md:p-12 text-center max-w-md w-full shadow-lg space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto text-red-500 border border-red-200/50 dark:border-red-900/30">
                        <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-[var(--ink)]">Yetkisiz Erişim</h3>
                        <p className="text-sm text-[var(--ink-3)] leading-relaxed">
                            Aktivite geçmişi ve sistem logları yalnızca **Yönetici** (ADMIN/MANAGER) rolündeki kullanıcılar tarafından görüntülenebilir.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold px-4 py-3 rounded-xl transition-all text-sm shadow-xs cursor-pointer"
                    >
                        Dashboard'a Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg)] p-6 md:p-8">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8 border-b border-[var(--border)] pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Aktivite Geçmişi</h1>
                    <p className="text-sm text-[var(--ink-3)] mt-1.5">
                        Kullanıcı eylemlerini ve sistem olaylarını kronolojik olarak canlı takip edin.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Kullanıcı veya işlem ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] rounded-xl outline-hidden focus:border-[var(--accent)] transition-colors placeholder-[var(--ink-3)]"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-[var(--ink-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-[var(--bg-2)] border border-[var(--border)] rounded-xl p-1 gap-1 overflow-x-auto">
                        {FILTER_TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setFilter(t.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                                    filter === t.key
                                        ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                                        : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Export Action */}
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center justify-center gap-2 bg-[var(--surface)] hover:bg-[var(--bg-2)] text-[var(--ink)] border border-[var(--border)] font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm shadow-xs cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Dışa aktar
                    </button>

                    {/* Delete/Clear logs trigger */}
                    <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <button
                                className="inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 font-bold px-4 py-2 rounded-xl border border-red-200/50 dark:border-red-900/30 transition-all duration-200 text-sm shadow-xs cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Geçmişi Temizle
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Aktivite Geçmişini Temizle</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu işlem kalıcıdır ve geri alınamaz. Sistemdeki tüm denetim günlükleri (audit logs) kalıcı olarak silinecektir. Emin misiniz?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClearLogs}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Temizle
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {loading ? (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-16 text-center text-[var(--ink-3)] font-medium animate-pulse">
                    Yükleniyor…
                </div>
            ) : groups.length === 0 ? (
                /* Empty State */
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-xs space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 flex items-center justify-center mx-auto text-[var(--ink-3)] border border-[var(--border)]">
                        <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-[var(--ink)]">Aktivite Kaydı Bulunamadı</h3>
                        <p className="text-sm text-[var(--ink-3)] max-w-sm mx-auto leading-relaxed">
                            {searchTerm || filter !== 'tumu' 
                                ? 'Arama kriterlerinize veya seçili filtreye uygun herhangi bir aktivite kaydı bulunamadı.'
                                : 'Sistem genelinde henüz kaydedilmiş bir aktivite veya işlem kaydı bulunmamaktadır.'}
                        </p>
                    </div>
                    {(searchTerm || filter !== 'tumu') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilter('tumu');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                        >
                            Filtreleri Temizle
                        </button>
                    )}
                </div>
            ) : (
                /* Grouped Logs View with premium left stripe coloring */
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden p-6 space-y-8 animate-in fade-in duration-200">
                    {groups.map((group, gi) => (
                        <div key={group.label} className="space-y-4">
                            {/* Date header */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-[var(--ink-3)] tracking-wider">{group.label}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-2)] text-[var(--ink-3)] border border-[var(--border)]">
                                    {group.items.length} olay
                                </span>
                                <div className="flex-1 h-px bg-[var(--border)]" />
                            </div>

                            {/* Events list */}
                            <div className="space-y-3">
                                {group.items.map((log) => {
                                    const theme = getLogTheme(log.action);
                                    const friendly = getFriendlyDescription(log);
                                    const detail = detailText(log);
                                    const isSystem = log.user.username.toLowerCase() === 'sistem' || log.user.role === 'SYSTEM';
                                    const avColor = isSystem ? '#94a3b8' : avatarColor(log.user.role);
                                    const initials = isSystem ? 'S' : log.user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                                    return (
                                        <div 
                                            key={log.id} 
                                            className="group/log relative flex gap-4 p-4 rounded-2xl border transition-all duration-150 shadow-xs hover:shadow-sm"
                                            style={{ 
                                                backgroundColor: theme.bg, 
                                                borderColor: theme.border,
                                                borderLeftWidth: '5px',
                                                borderLeftColor: theme.color
                                            }}
                                        >
                                            {/* Action Indicator Icon */}
                                            <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                                                <div 
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: theme.labelBg, color: theme.labelText }}
                                                >
                                                    {theme.node}
                                                </div>
                                            </div>

                                            {/* Event Info Card */}
                                            <div className="flex-1 min-w-0 pr-8">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        {/* Actor Avatar & Name */}
                                                        <div 
                                                            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                                                            style={{ backgroundColor: avColor }}
                                                        >
                                                            {initials}
                                                        </div>
                                                        <span className="text-xs font-extrabold text-[var(--ink)] whitespace-nowrap">
                                                            {friendly.subject}
                                                        </span>
                                                        {friendly.target && (
                                                            <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-lg border border-[var(--accent)]/10">
                                                                {friendly.target}
                                                            </span>
                                                        )}
                                                        <span className="text-xs font-semibold text-[var(--ink-2)]">
                                                            {friendly.verb}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Event Time */}
                                                    <span className="text-[11px] font-mono font-bold text-[var(--ink-3)] flex-shrink-0">
                                                        {fmtTime(log.createdAt)}
                                                    </span>
                                                </div>
                                                
                                                {/* Meta details if available */}
                                                {detail && (
                                                    <div className="mt-2.5 pl-0.5">
                                                        <span 
                                                            className="inline-flex text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1"
                                                            style={{ backgroundColor: theme.labelBg, color: theme.labelText }}
                                                        >
                                                            {detail}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Single Log Delete Button */}
                                            <div className="absolute right-4 top-4 opacity-0 group-hover/log:opacity-100 transition-opacity duration-150">
                                                <button
                                                    onClick={() => handleDeleteLog(log.id)}
                                                    title="Kaydı sil"
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 border border-slate-200 dark:border-zinc-800 hover:border-red-200/50 dark:hover:border-red-900/30 transition-all shadow-xs cursor-pointer"
                                                >
                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex gap-2 items-center justify-center pt-6 border-t border-[var(--border)]">
                            <button
                                className="inline-flex items-center justify-center px-4 py-2 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--ink)] text-sm font-semibold hover:bg-[var(--bg-2)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                ← Önceki
                            </button>
                            <span className="text-xs font-semibold text-[var(--ink-2)] px-4">
                                {page} / {totalPages}
                            </span>
                            <button
                                className="inline-flex items-center justify-center px-4 py-2 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--ink)] text-sm font-semibold hover:bg-[var(--bg-2)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Sonraki →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
