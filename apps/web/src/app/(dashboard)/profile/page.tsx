'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { changePassword, updateProfile } from '@/lib/users';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type PwdForm = { currentPassword: string; newPassword: string; confirmPassword: string };

export default function ProfilePage() {
    const [notifSound, setNotifSound] = useState(true);
    const [notifBrowser, setNotifBrowser] = useState(true);
    const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<PwdForm>();

    async function onChangePassword(values: PwdForm) {
        if (values.newPassword !== values.confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor');
            return;
        }
        try {
            await changePassword(values.currentPassword, values.newPassword);
            toast.success('Şifre değiştirildi');
            reset();
        } catch (e: any) {
            toast.error(e?.message ?? 'Şifre değiştirilemedi');
        }
    }

    async function handleNotifUpdate(key: 'notificationSound' | 'notificationBrowser', value: boolean) {
        try {
            await updateProfile({ [key]: value });
            toast.success('Tercih kaydedildi');
        } catch {
            toast.error('Tercih kaydedilemedi');
        }
    }

    return (
        <div className="rp" style={{ padding: '24px 32px', maxWidth: 600 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 24 }}>Profil Ayarları</h1>

            <div className="rp-card" style={{ padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>Şifre Değiştir</h2>
                <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                    <div className="space-y-1">
                        <Label>Mevcut Şifre</Label>
                        <Input type="password" {...register('currentPassword', { required: true })} placeholder="Mevcut şifreniz" />
                    </div>
                    <div className="space-y-1">
                        <Label>Yeni Şifre</Label>
                        <Input type="password" {...register('newPassword', { required: true, minLength: 6 })} placeholder="En az 6 karakter" />
                        {errors.newPassword?.type === 'minLength' && (
                            <p style={{ fontSize: 12, color: 'var(--danger)' }}>En az 6 karakter olmalı</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>Yeni Şifre (Tekrar)</Label>
                        <Input type="password" {...register('confirmPassword', { required: true })} placeholder="Yeni şifrenizi tekrar girin" />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </Button>
                </form>
            </div>

            <div className="rp-card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>Bildirim Tercihleri</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <ToggleRow
                        label="Ses Bildirimleri"
                        description="Yeni bildirim geldiğinde ses çal"
                        checked={notifSound}
                        onChange={(v) => { setNotifSound(v); handleNotifUpdate('notificationSound', v); }}
                    />
                    <ToggleRow
                        label="Tarayıcı Bildirimleri"
                        description="Native tarayıcı bildirimleri göster"
                        checked={notifBrowser}
                        onChange={(v) => { setNotifBrowser(v); handleNotifUpdate('notificationBrowser', v); }}
                    />
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ label, description, checked, onChange }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{description}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: checked ? 'var(--accent)' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s',
                }}
            >
                <span style={{
                    position: 'absolute', top: 3, left: checked ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                }} />
            </button>
        </div>
    );
}
