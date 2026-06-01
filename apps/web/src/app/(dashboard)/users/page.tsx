'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { getUsers, createUser, updateUser, deleteUser, User, UserRole } from '@/lib/users';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';

const ROLE_META: Record<string, { label: string; color: string; desc: string }> = {
    ADMIN: { label: 'Yönetici', color: '#7c3aed', desc: 'Tüm haklar, kullanıcı yönetimi' },
    MANAGER: { label: 'Yönetici', color: '#7c3aed', desc: 'Tüm haklar, kullanıcı yönetimi' },
    OPERATOR: { label: 'Operatör', color: '#0d9488', desc: 'Sefer/araç yönet, rapor görür' },
    VIEWER: { label: 'Görüntüleyici', color: '#64748b', desc: 'Sadece okuma izni' },
};

function roleKey(r: string) { return r === 'MANAGER' ? 'ADMIN' : r; }

// Real relative time formatter for last login
function formatLastActive(lastLoginAt?: string | null): string {
    if (!lastLoginAt) return 'Hiç giriş yapmadı';

    const date = new Date(lastLoginAt);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Aktif şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
}

// Real user status evaluator (Active, Suspended)
function getUserStatus(u: User): 'Aktif' | 'Askıda' {
    if (!u.isActive) return 'Askıda';
    return 'Aktif';
}

function StatusPill({ s }: { s: 'Aktif' | 'Askıda' }) {
    if (s === 'Aktif') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-800/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Askıda
        </span>
    );
}

type FormValues = {
    username: string;
    fullName: string;
    password?: string;
    email: string;
    phone: string;
    role: UserRole;
    isActive: boolean;
    twoFactorEnabled: boolean;
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<FormValues>();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getUsers({ limit: 200 });
            setUsers(res.data);
            setTotal(res.total);
        } catch {
            toast.error('Kullanıcılar yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const adminCount = users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER').length;
    const opCount = users.filter(u => u.role === 'OPERATOR').length;
    const viewCount = users.filter(u => u.role === 'VIEWER').length;

    const activeCount = users.filter(u => u.isActive).length;
    const suspendedCount = users.filter(u => !u.isActive).length;

    const filtered = roleFilter
        ? users.filter(u => roleKey(u.role) === roleFilter)
        : users;

    function openCreate() {
        setEditUser(null);
        reset({
            username: '',
            fullName: '',
            password: '',
            email: '',
            phone: '',
            role: 'OPERATOR',
            isActive: true,
            twoFactorEnabled: false
        });
        setDialogOpen(true);
    }

    function openEdit(u: User) {
        setEditUser(u);
        reset({
            username: u.username,
            fullName: u.fullName,
            password: '',
            email: u.email ?? '',
            phone: u.phone ?? '',
            role: u.role,
            isActive: u.isActive,
            twoFactorEnabled: u.twoFactorEnabled ?? false
        });
        setDialogOpen(true);
    }

    async function onSubmit(v: FormValues) {
        try {
            if (editUser) {
                await updateUser(editUser.id, {
                    username: v.username,
                    fullName: v.fullName,
                    email: v.email || undefined,
                    phone: v.phone || undefined,
                    role: v.role,
                    isActive: v.isActive,
                    twoFactorEnabled: v.twoFactorEnabled
                });
            } else {
                await createUser({
                    username: v.username,
                    fullName: v.fullName,
                    password: v.password || '',
                    email: v.email || undefined,
                    phone: v.phone || undefined,
                    role: v.role,
                    twoFactorEnabled: v.twoFactorEnabled
                });
            }
            toast.success(editUser ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu');
            setDialogOpen(false);
            load();
        } catch {
            toast.error('İşlem başarısız');
        }
    }

    const ROLE_CARDS = [
        { key: 'ADMIN', label: 'Yönetici', color: '#7c3aed', desc: 'Tüm haklar, kullanıcı yönetimi', count: adminCount },
        { key: 'OPERATOR', label: 'Operatör', color: '#0d9488', desc: 'Sefer/araç yönet, rapor görür', count: opCount },
        { key: 'VIEWER', label: 'Görüntüleyici', color: '#64748b', desc: 'Sadece okuma izni', count: viewCount },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg)] p-6 md:p-8">
            <style>{`
                .usr-row { transition: background-color .15s ease; }
                .usr-row:hover { background-color: var(--bg-2); }
            `}</style>

            {/* 1. SAYFA BAŞLIĞI */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 mb-8 border-b border-[var(--border)] pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Kullanıcılar</h1>
                    <p className="text-sm text-[var(--ink-3)] mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[var(--ink)]">{total}</span> kullanıcı
                        <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeCount} aktif</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                        <span className="font-semibold text-red-500">{suspendedCount} askıda</span>
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all duration-200 self-start sm:self-center"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Kullanıcı Oluştur
                </button>
            </div>

            {/* 2. ROL KARTLARI BAŞLIĞI & FİLTREYİ TEMİZLE */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)]">Rol Bazlı Filtreler</h2>
                {roleFilter && (
                    <button
                        onClick={() => setRoleFilter(null)}
                        className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 bg-[var(--accent)]/10 px-2.5 py-1 rounded-lg transition-all"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Filtreyi temizle
                    </button>
                )}
            </div>

            {/* ROL KARTLARI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {ROLE_CARDS.map(rc => {
                    const active = roleFilter === rc.key;
                    return (
                        <button
                            key={rc.key}
                            onClick={() => setRoleFilter(active ? null : rc.key)}
                            className="group relative flex items-stretch w-full rounded-2xl border transition-all duration-200 overflow-hidden text-left bg-[var(--surface)]"
                            style={{
                                borderColor: active ? rc.color : 'var(--border)',
                                boxShadow: active ? `0 0 0 2px ${rc.color}25, 0 4px 12px rgba(0,0,0,0.03)` : '0 1px 3px rgba(0,0,0,0.02)',
                                backgroundColor: active ? `${rc.color}05` : 'var(--surface)'
                            }}
                        >
                            {/* Left-color stripe */}
                            <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: rc.color }} />

                            {/* Middle content */}
                            <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
                                <div className="font-bold text-base text-[var(--ink)] mb-0.5 flex items-center gap-1.5">
                                    {rc.label}
                                    {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rc.color }} />}
                                </div>
                                <div className="text-xs text-[var(--ink-3)] leading-relaxed">{rc.desc}</div>
                            </div>

                            {/* Right monospace count */}
                            <div
                                className="px-5 md:px-6 flex items-center justify-center font-mono font-extrabold text-3xl transition-colors duration-200"
                                style={{ color: rc.color }}
                            >
                                {rc.count}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* 3. KULLANICI TABLOSU */}
            {loading ? (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-16 text-center text-[var(--ink-3)] font-medium">
                    Yükleniyor…
                </div>
            ) : (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">

                    {/* Tablo Üst Bilgi Barı */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                        <div>
                            <h3 className="font-bold text-sm text-[var(--ink)]">
                                {roleFilter ? `${ROLE_META[roleFilter]?.label} Listesi` : 'Tüm Kullanıcılar'}
                            </h3>
                            <p className="text-xs text-[var(--ink-3)] mt-0.5">{filtered.length} kayıt listeleniyor</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[var(--bg-2)] border-b border-[var(--border)]">
                                    {['KULLANICI', 'ROL', '2FA', 'SON AKTİVİTE', 'DURUM', ''].map((h, i) => (
                                        <th
                                            key={i}
                                            className="px-6 py-3.5 text-left text-xs font-bold text-[var(--ink-3)] tracking-wider uppercase"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {filtered.map(u => {
                                    const meta = ROLE_META[u.role] ?? ROLE_META['VIEWER']!;
                                    const tf = u.twoFactorEnabled ?? false;
                                    const status = getUserStatus(u);
                                    const lastActive = formatLastActive(u.lastLoginAt);
                                    const isNow = lastActive === 'Aktif şimdi';

                                    return (
                                        <tr
                                            key={u.id}
                                            className="usr-row group cursor-pointer"
                                        >
                                            {/* Kullanıcı Bilgisi */}
                                            <td
                                                onClick={() => setSelectedUser(u)}
                                                className="px-6 py-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs flex-shrink-0"
                                                        style={{ backgroundColor: meta.color }}
                                                    >
                                                        {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                                                            {u.fullName}
                                                        </div>
                                                        <div className="text-xs text-[var(--ink-3)] mt-0.5">
                                                            {u.email ?? 'E-posta belirtilmemiş'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rol */}
                                            <td
                                                onClick={() => setSelectedUser(u)}
                                                className="px-6 py-4"
                                            >
                                                <span
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
                                                    style={{
                                                        borderColor: `${meta.color}30`,
                                                        backgroundColor: `${meta.color}0c`,
                                                        color: meta.color
                                                    }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                                    {meta.label}
                                                </span>
                                            </td>

                                            {/* 2FA */}
                                            <td
                                                onClick={() => setSelectedUser(u)}
                                                className="px-6 py-4"
                                            >
                                                {tf ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Açık
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--bg-2)] text-[var(--ink-3)] border border-[var(--border)]">
                                                        Kapalı
                                                    </span>
                                                )}
                                            </td>

                                            {/* Son Aktivite */}
                                            <td
                                                onClick={() => setSelectedUser(u)}
                                                className="px-6 py-4 text-sm"
                                            >
                                                <span className={isNow ? "text-[var(--accent)] font-semibold" : "text-[var(--ink-2)]"}>
                                                    {lastActive}
                                                </span>
                                            </td>

                                            {/* Durum */}
                                            <td
                                                onClick={() => setSelectedUser(u)}
                                                className="px-6 py-4"
                                            >
                                                <StatusPill s={status} />
                                            </td>

                                            {/* İşlem Butonları (3 Nokta Menü) */}
                                            <td className="px-6 py-4 text-right w-16">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--ink-3)] hover:bg-[var(--bg-2)] hover:text-[var(--ink)] transition-colors outline-hidden">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                            </svg>
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-md p-1.5 z-50">
                                                        <DropdownMenuItem
                                                            onClick={() => openEdit(u)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Düzenle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 border-t border-slate-100 dark:border-zinc-900" />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteId(u.id)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Kaldır
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[var(--ink-3)] text-sm font-medium">
                                            Kullanıcı bulunamadı
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Kullanıcı Ekleme / Düzenleme Dialog */}
            <Dialog open={dialogOpen} onOpenChange={v => !v && setDialogOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Kullanıcı Adı *</Label>
                                <Input {...register('username', { required: true })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Ad Soyad *</Label>
                                <Input {...register('fullName', { required: true })} />
                            </div>
                        </div>
                        {!editUser && (
                            <div className="space-y-1">
                                <Label>Şifre *</Label>
                                <Input type="password" {...register('password', { required: !editUser })} />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Rol</Label>
                                <Select defaultValue={editUser?.role ?? 'OPERATOR'} onValueChange={v => setValue('role', v as UserRole)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {((['ADMIN', 'OPERATOR', 'VIEWER'] as UserRole[])).map(r => (
                                            <SelectItem key={r} value={r}>{ROLE_META[r]!.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Durum</Label>
                                <Select defaultValue={editUser ? (editUser.isActive ? 'true' : 'false') : 'true'} onValueChange={v => setValue('isActive', v === 'true')}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Aktif</SelectItem>
                                        <SelectItem value="false">Askıda</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>E-posta</Label>
                                <Input type="email" {...register('email')} />
                            </div>
                            <div className="space-y-1">
                                <Label>Telefon</Label>
                                <Input {...register('phone')} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>İki Adımlı Doğrulama (2FA)</Label>
                            <Select defaultValue={editUser ? (editUser.twoFactorEnabled ? 'true' : 'false') : 'false'} onValueChange={v => setValue('twoFactorEnabled', v === 'true')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Açık</SelectItem>
                                    <SelectItem value="false">Kapalı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Kullanıcı Kaldırma Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kullanıcıyı Kaldır</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. Seçilen kullanıcı sistemden kalıcı olarak silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!deleteId) return;
                                try {
                                    await deleteUser(deleteId);
                                    toast.success('Silindi');
                                    setDeleteId(null);
                                    load();
                                } catch {
                                    toast.error('Hata');
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Kaldır
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Detay Slide-over Panel */}
            <Sheet open={!!selectedUser} onOpenChange={v => !v && setSelectedUser(null)}>
                <SheetContent className="sm:max-w-lg overflow-y-auto p-0 flex flex-col h-full bg-[var(--surface)] text-[var(--ink)] border-l border-[var(--border)]">
                    {selectedUser && (() => {
                        const meta = ROLE_META[selectedUser.role] ?? ROLE_META['VIEWER']!;
                        const status = getUserStatus(selectedUser);
                        const lastActive = formatLastActive(selectedUser.lastLoginAt);
                        const isNow = lastActive === 'Aktif şimdi';
                        const initials = selectedUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                        // Get RBAC specific info list
                        const rbacRules = selectedUser.role === 'ADMIN' || selectedUser.role === 'MANAGER' 
                            ? [
                                "Sistem genelindeki tüm operasyonları yönetebilir.",
                                "Yeni kullanıcı davet edebilir, düzenleyebilir ve kaldırabilir.",
                                "Rol bazlı erişim yetkilerini (RBAC) kontrol edebilir.",
                                "Sefer, araç, durak ve hat ayarlarını tamamen düzenleyebilir.",
                                "Tüm raporları ve sistem loglarını görüntüleyebilir."
                            ]
                            : selectedUser.role === 'OPERATOR'
                            ? [
                                "Aktif seferleri, araçları ve durakları yönetebilir.",
                                "Günlük operasyonel planlama yapabilir.",
                                "Hata ve arıza raporlarını inceleyebilir.",
                                "Sistem genel yetki veya kullanıcı yönetimi paneline erişemez."
                            ]
                            : [
                                "Sadece okuma ve görüntüleme yetkisine sahiptir.",
                                "Planlamaları, seferleri ve harita ekranını izleyebilir.",
                                "Veri ekleme, silme, güncelleme veya düzenleme yapamaz."
                            ];

                        return (
                            <>
                                {/* Panel Header Background & Avatar */}
                                <div className="relative pt-20 pb-6 px-6 border-b border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/30 flex-shrink-0">
                                    <div className="absolute top-4 left-6">
                                        <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--ink-3)]">
                                            Kullanıcı Profili
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0 animate-in fade-in zoom-in-95 duration-200"
                                            style={{ backgroundColor: meta.color }}
                                        >
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-extrabold text-[var(--ink)] leading-snug truncate">
                                                {selectedUser.fullName}
                                            </h2>
                                            <p className="text-sm text-[var(--ink-3)] mt-0.5 font-medium truncate">
                                                @{selectedUser.username}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* Durum & Hızlı Aksiyon Kartı */}
                                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <div className="text-xs font-bold text-[var(--ink-3)] uppercase tracking-wider">Hesap Durumu</div>
                                                <div className="text-xs text-[var(--ink-3)]">Son Görülme: <span className="font-semibold text-[var(--ink)]">{lastActive}</span></div>
                                            </div>
                                            <StatusPill s={status} />
                                        </div>

                                        <div className="pt-2 border-t border-[var(--border)] flex gap-3">
                                            {selectedUser.isActive ? (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const updated = await updateUser(selectedUser.id, { isActive: false });
                                                            setSelectedUser(updated);
                                                            toast.success('Kullanıcı hesabı askıya alındı');
                                                            load();
                                                        } catch {
                                                            toast.error('İşlem gerçekleştirilemedi');
                                                        }
                                                    }}
                                                    className="w-full inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 font-bold px-4 py-2.5 rounded-xl border border-red-200/50 dark:border-red-900/30 transition-all duration-150 text-sm shadow-xs cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                    Hesabı Askıya Al
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const updated = await updateUser(selectedUser.id, { isActive: true });
                                                            setSelectedUser(updated);
                                                            toast.success('Kullanıcı hesabı aktifleştirildi');
                                                            load();
                                                        } catch {
                                                            toast.error('İşlem gerçekleştirilemedi');
                                                        }
                                                    }}
                                                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400 font-bold px-4 py-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 transition-all duration-150 text-sm shadow-xs cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Hesabı Aktif Et
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2FA Status Card */}
                                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <div className="text-xs font-bold text-[var(--ink-3)] uppercase tracking-wider">İki Adımlı Doğrulama</div>
                                                <div className="text-xs text-[var(--ink-3)]">Ekstra Güvenlik Katmanı (2FA)</div>
                                            </div>
                                            {selectedUser.twoFactorEnabled ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                                                    Açık
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--bg-2)] text-[var(--ink-3)] border border-[var(--border)]">
                                                    Kapalı
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--ink-3)] leading-relaxed pt-2 border-t border-[var(--border)]">
                                            Kullanıcı iki adımlı doğrulama aktif ettiğinde, giriş işlemi sırasında şifresinin ardından tek seferlik 6 haneli doğrulama kodunu girmek zorundadır.
                                        </p>
                                    </div>

                                    {/* Rol & Yetki Tanımları */}
                                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
                                        <div>
                                            <div className="text-xs font-bold text-[var(--ink-3)] uppercase tracking-wider">Rol & Sistem Yetkileri</div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
                                                    style={{
                                                        borderColor: `${meta.color}30`,
                                                        backgroundColor: `${meta.color}0c`,
                                                        color: meta.color
                                                    }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                                    {meta.label}
                                                </span>
                                                <span className="text-xs text-[var(--ink-3)] font-medium">({meta.desc})</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-[var(--border)]">
                                            <div className="text-xs font-bold text-[var(--ink-2)] mb-2">Bu Rolün Yapabileceği İşlemler:</div>
                                            <ul className="space-y-2">
                                                {rbacRules.map((rule, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-xs text-[var(--ink-3)] leading-relaxed">
                                                        <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span>{rule}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Detay Bilgiler */}
                                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
                                        <div className="text-xs font-bold text-[var(--ink-3)] uppercase tracking-wider">İletişim & Sistem Bilgileri</div>
                                        <div className="space-y-3 text-xs">
                                            <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                                                <span className="text-[var(--ink-3)]">E-posta</span>
                                                <span className="font-semibold text-[var(--ink)]">{selectedUser.email ?? 'E-posta belirtilmemiş'}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                                                <span className="text-[var(--ink-3)]">Telefon</span>
                                                <span className="font-semibold text-[var(--ink)]">{selectedUser.phone ?? 'Telefon belirtilmemiş'}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                                                <span className="text-[var(--ink-3)]">Kayıt Tarihi</span>
                                                <span className="font-semibold text-[var(--ink)]">
                                                    {new Date(selectedUser.createdAt).toLocaleDateString('tr-TR', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 pt-1">
                                                <span className="text-[var(--ink-3)]">Kullanıcı Benzersiz Kimliği (UUID)</span>
                                                <span className="font-mono text-[10px] text-[var(--ink-3)] bg-[var(--bg-2)] p-2 rounded-lg break-all select-all border border-[var(--border)]">
                                                    {selectedUser.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="p-4 border-t border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/30 flex gap-3 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            const u = selectedUser;
                                            setSelectedUser(null);
                                            openEdit(u);
                                        }}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm shadow-xs cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--bg-2)] hover:bg-[var(--border)] text-[var(--ink-2)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border)] transition-all text-sm shadow-xs cursor-pointer"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </SheetContent>
            </Sheet>
        </div>
    );
}
