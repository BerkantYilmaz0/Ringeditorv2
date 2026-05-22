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

const ROLE_META: Record<string, { label:string; color:string; desc:string }> = {
    ADMIN:    { label:'Yönetici',      color:'#7c3aed', desc:'Tüm haklar, kullanıcı yönetimi' },
    MANAGER:  { label:'Yönetici',      color:'#7c3aed', desc:'Tüm haklar, kullanıcı yönetimi' },
    OPERATOR: { label:'Operatör',      color:'#0d9488', desc:'Sefer/araç yönet, rapor görür' },
    VIEWER:   { label:'Görüntüleyici', color:'#64748b', desc:'Sadece okuma izni' },
};

function roleKey(r: string) { return r === 'MANAGER' ? 'ADMIN' : r; }

// Deterministic fake data
function fakeEmail(u: User) {
    return `${u.username.toLowerCase().replace(/[^a-z0-9]/g,'')}@kurum.gov.tr`;
}
function fakeLastActive(u: User): string {
    const s = u.id.charCodeAt(0) % 6;
    if (s === 0) return 'Aktif şimdi';
    if (s === 1) return '12 dk önce';
    if (s === 2) return '1 saat önce';
    if (s === 3) return 'Dün 18:42';
    if (s === 4) return 'Davet edildi';
    return '10 gün önce';
}
function fakeStatus(u: User): 'Aktif' | 'Davetli' | 'Askıda' {
    if (!u.isActive) return 'Askıda';
    const s = u.id.charCodeAt(1) % 5;
    if (s === 0) return 'Davetli';
    return 'Aktif';
}
function has2FA(u: User) { return (u.id.charCodeAt(0) + u.id.charCodeAt(2)) % 3 !== 0; }

function StatusPill({ s }: { s: 'Aktif'|'Davetli'|'Askıda' }) {
    if (s === 'Aktif')   return <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#dcfce7', color:'#15803d' }}>Aktif</span>;
    if (s === 'Askıda')  return <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#fee2e2', color:'#dc2626' }}>Askıda</span>;
    return <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'var(--bg-2)', color:'var(--ink-3)' }}>Davetli</span>;
}

type FormValues = { username:string; fullName:string; password:string; email:string; phone:string; role:UserRole };

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string|null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState<User|null>(null);
    const [deleteId, setDeleteId] = useState<string|null>(null);
    const { register, handleSubmit, reset, setValue, formState:{isSubmitting} } = useForm<FormValues>();

    const load = useCallback(async () => {
        setLoading(true);
        try { const res = await getUsers({ limit:200 }); setUsers(res.data); setTotal(res.total); }
        catch { toast.error('Kullanıcılar yüklenemedi'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const adminCount = users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER').length;
    const opCount    = users.filter(u => u.role === 'OPERATOR').length;
    const viewCount  = users.filter(u => u.role === 'VIEWER').length;
    const activeCount = users.filter(u => u.isActive).length;

    const filtered = roleFilter
        ? users.filter(u => roleKey(u.role) === roleFilter)
        : users;

    function openCreate() { setEditUser(null); reset({ username:'', fullName:'', password:'', email:'', phone:'', role:'OPERATOR' }); setDialogOpen(true); }
    function openEdit(u: User) { setEditUser(u); reset({ username:u.username, fullName:u.fullName, password:'', email:u.email??'', phone:u.phone??'', role:u.role }); setDialogOpen(true); }

    async function onSubmit(v: FormValues) {
        try {
            if (editUser) await updateUser(editUser.id, { username:v.username, fullName:v.fullName, email:v.email||undefined, phone:v.phone||undefined, role:v.role });
            else await createUser({ ...v, email:v.email||undefined, phone:v.phone||undefined });
            toast.success(editUser ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu');
            setDialogOpen(false); load();
        } catch { toast.error('İşlem başarısız'); }
    }

    const ROLE_CARDS = [
        { key:'ADMIN',    label:'Yönetici',      color:'#7c3aed', desc:'Tüm haklar, kullanıcı yönetimi', count:adminCount },
        { key:'OPERATOR', label:'Operatör',       color:'#0d9488', desc:'Sefer/araç yönet, rapor görür',  count:opCount },
        { key:'VIEWER',   label:'Görüntüleyici',  color:'#64748b', desc:'Sadece okuma izni',              count:viewCount },
    ];

    return (
        <div className="rp" style={{ padding:'28px 32px' }}>
            <style>{`
                .usr-row { transition: background .1s; cursor: pointer; }
                .usr-row:hover { background: var(--bg-2); }
                .usr-dot { opacity:0; transition:opacity .15s; }
                .usr-row:hover .usr-dot { opacity:1; }
            `}</style>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:22, fontWeight:700, color:'var(--ink)', margin:0 }}>Kullanıcılar</h1>
                    <p style={{ fontSize:13, color:'var(--ink-3)', margin:'5px 0 0' }}>
                        {total} kullanıcı · {activeCount} aktif{users.filter(u=>fakeStatus(u)==='Davetli').length > 0 && `, ${users.filter(u=>fakeStatus(u)==='Davetli').length} davet bekleniyor`}
                    </p>
                </div>
                <button className="rp-btn rp-btn--primary" style={{ display:'flex', alignItems:'center', gap:6, height:36 }} onClick={openCreate}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    Kullanıcı davet et
                </button>
            </div>

            {/* Role cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                {ROLE_CARDS.map(rc => {
                    const active = roleFilter === rc.key;
                    return (
                        <button key={rc.key} onClick={() => setRoleFilter(active ? null : rc.key)}
                            style={{
                                display:'flex', alignItems:'stretch', border:'none', padding:0, borderRadius:12,
                                overflow:'hidden', cursor:'pointer', textAlign:'left',
                                background:'var(--surface)',
                                boxShadow: active ? `0 0 0 2px ${rc.color}` : '0 1px 4px rgba(15,23,42,.07)',
                                transition:'box-shadow .15s',
                            }}>
                            <div style={{ width:4, flexShrink:0, background:rc.color }} />
                            <div style={{ padding:'14px 16px', flex:1, background: active ? `${rc.color}0c` : 'transparent' }}>
                                <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>{rc.label}</div>
                                <div style={{ fontSize:12, color:'var(--ink-3)' }}>{rc.desc}</div>
                            </div>
                            <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', background: active ? `${rc.color}0c` : 'transparent' }}>
                                <span style={{ fontSize:28, fontWeight:700, color:rc.color, fontVariantNumeric:'tabular-nums' }}>{rc.count}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            {loading ? (
                <div className="rp-card" style={{ padding:56, textAlign:'center', color:'var(--ink-3)' }}>Yükleniyor…</div>
            ) : (
                <div className="rp-card" style={{ overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
                        <div>
                            <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>Tüm Kullanıcılar</div>
                            <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:1 }}>{filtered.length} kayıt</div>
                        </div>
                        {roleFilter && (
                            <button onClick={() => setRoleFilter(null)}
                                style={{ fontSize:13, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                                Filtreyi temizle
                            </button>
                        )}
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--border)' }}>
                                {['KULLANICI','ROL','2FA','SON AKTİVİTE','DURUM',''].map((h,i) => (
                                    <th key={i} style={{ padding:'9px 20px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--ink-3)', letterSpacing:.5, textTransform:'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => {
                                const meta = ROLE_META[u.role] ?? ROLE_META['VIEWER']!;
                                const tf = has2FA(u);
                                const status = fakeStatus(u);
                                return (
                                    <tr key={u.id} className="usr-row" style={{ borderBottom:'1px solid var(--border)' }}>
                                        {/* Kullanıcı */}
                                        <td style={{ padding:'13px 20px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                                <div style={{ width:36, height:36, borderRadius:'50%', background:meta.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                                                    {u.fullName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>{u.fullName}</div>
                                                    <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:1 }}>{fakeEmail(u)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Rol */}
                                        <td style={{ padding:'13px 20px' }}>
                                            <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, border:`1.5px solid ${meta.color}30`, background:`${meta.color}10`, color:meta.color }}>
                                                <span style={{ width:6, height:6, borderRadius:'50%', background:meta.color, flexShrink:0 }} />
                                                {meta.label}
                                            </span>
                                        </td>
                                        {/* 2FA */}
                                        <td style={{ padding:'13px 20px' }}>
                                            {tf ? (
                                                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#dcfce7', color:'#15803d' }}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                    Açık
                                                </span>
                                            ) : (
                                                <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'var(--bg-2)', color:'var(--ink-3)' }}>Kapalı</span>
                                            )}
                                        </td>
                                        {/* Son aktivite */}
                                        <td style={{ padding:'13px 20px', fontSize:13, color:'var(--ink-2)' }}>{fakeLastActive(u)}</td>
                                        {/* Durum */}
                                        <td style={{ padding:'13px 20px' }}><StatusPill s={status} /></td>
                                        {/* … */}
                                        <td style={{ padding:'13px 12px', width:28 }}>
                                            <div className="usr-dot" style={{ display:'flex', gap:3 }}>
                                                <button className="rp-icon-btn" title="Düzenle" onClick={e => { e.stopPropagation(); openEdit(u); }}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </button>
                                                <button className="rp-icon-btn rp-icon-btn--danger" title="Sil" onClick={e => { e.stopPropagation(); setDeleteId(u.id); }}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>Kullanıcı bulunamadı</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={v => !v && setDialogOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Kullanıcı Adı *</Label><Input {...register('username',{required:true})} /></div>
                            <div className="space-y-1"><Label>Ad Soyad *</Label><Input {...register('fullName',{required:true})} /></div>
                        </div>
                        {!editUser && <div className="space-y-1"><Label>Şifre *</Label><Input type="password" {...register('password',{required:!editUser})} /></div>}
                        <div className="space-y-1">
                            <Label>Rol</Label>
                            <Select defaultValue={editUser?.role ?? 'OPERATOR'} onValueChange={v => setValue('role', v as UserRole)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(['ADMIN','OPERATOR','VIEWER'] as UserRole[]).map(r => (
                                        <SelectItem key={r} value={r}>{ROLE_META[r]!.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>E-posta</Label><Input type="email" {...register('email')} /></div>
                            <div className="space-y-1"><Label>Telefon</Label><Input {...register('phone')} /></div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kullanıcıyı Kaldır</AlertDialogTitle>
                        <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => { if (!deleteId) return; try { await deleteUser(deleteId); toast.success('Silindi'); setDeleteId(null); load(); } catch { toast.error('Hata'); } }} style={{ background:'var(--danger)' }}>Kaldır</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
