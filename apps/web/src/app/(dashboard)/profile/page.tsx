'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { 
    Key, 
    Bell, 
    Shield, 
    CheckCircle2, 
    Copy, 
    Check, 
    Lock, 
    AlertTriangle,
    QrCode,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { changePassword, updateProfile } from '@/lib/users';
import { getMe, setup2FA, enable2FA, disable2FA } from '@/lib/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type PwdForm = { currentPassword: string; newPassword: string; confirmPassword: string };

export default function ProfilePage() {
    const [user, setUser] = useState<{ id: string; username: string; role: string; fullName?: string; twoFactorEnabled?: boolean } | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    
    // Preferences states
    const [notifSound, setNotifSound] = useState(true);
    const [notifBrowser, setNotifBrowser] = useState(true);
    
    // 2FA Wizard states
    const [is2faModalOpen, setIs2faModalOpen] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
    const [totpCode, setTotpCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [verifying2fa, setVerifying2fa] = useState(false);

    // Disable 2FA states
    const [showDisableForm, setShowDisableForm] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [disabling, setDisabling] = useState(false);

    const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<PwdForm>();

    // Load active user profile information
    useEffect(() => {
        getMe()
            .then(data => {
                if (data) {
                    setUser(data);
                    // Mock notification bindings for demonstration or set defaults
                    setNotifSound(true);
                    setNotifBrowser(true);
                }
                setLoadingUser(false);
            })
            .catch(() => {
                setLoadingUser(false);
            });
    }, []);

    async function onChangePassword(values: PwdForm) {
        if (values.newPassword !== values.confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor');
            return;
        }
        try {
            await changePassword(values.currentPassword, values.newPassword);
            toast.success('Şifreniz başarıyla değiştirildi');
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

    // 2FA Setup Flow triggers
    async function handleInitiate2FA() {
        try {
            setSetupStep(1);
            setTotpCode('');
            setCopiedSecret(false);
            const data = await setup2FA();
            setSetupData(data);
            setIs2faModalOpen(true);
        } catch (e: any) {
            toast.error(e?.message ?? '2FA kurulumu başlatılamadı');
        }
    }

    async function handleVerifyAndEnable() {
        if (totpCode.length !== 6) {
            toast.error('Lütfen 6 haneli doğrulama kodunu girin');
            return;
        }
        setVerifying2fa(true);
        try {
            const result = await enable2FA(totpCode);
            setRecoveryCodes(result.recoveryCodes || []);
            setSetupStep(3);
            if (user) {
                setUser({ ...user, twoFactorEnabled: true });
            }
            toast.success('İki adımlı doğrulama (2FA) başarıyla etkinleştirildi!');
        } catch (e: any) {
            toast.error(e?.message ?? 'Doğrulama kodu geçersiz, lütfen tekrar deneyin');
        } finally {
            setVerifying2fa(false);
        }
    }

    async function handleDisable2FA() {
        if (!disablePassword) {
            toast.error('Lütfen hesabınızın şifresini girin');
            return;
        }
        setDisabling(true);
        try {
            await disable2FA(disablePassword);
            if (user) {
                setUser({ ...user, twoFactorEnabled: false });
            }
            setShowDisableForm(false);
            setDisablePassword('');
            toast.success('İki adımlı doğrulama (2FA) devre dışı bırakıldı');
        } catch (e: any) {
            toast.error(e?.message ?? 'Şifreniz hatalı, 2FA devre dışı bırakılamadı');
        } finally {
            setDisabling(false);
        }
    }

    const copyToClipboard = (text: string, index: number | 'secret') => {
        navigator.clipboard.writeText(text);
        if (index === 'secret') {
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        } else {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        }
        toast.success('Pano kopyalandı');
    };

    if (loadingUser) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Profil Yükleniyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fleet-page max-w-5xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="rp-crumbs">
                <span>Genel</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-600 font-semibold">Profil Ayarları</span>
            </div>

            {/* Page Header */}
            <div className="rp-pagehead">
                <div>
                    <h1 className="rp-h1">Profil Ayarları</h1>
                    <p className="rp-sub">Kişisel bilgilerinizi güncelleyin ve hesap güvenliğinizi en üst düzeye çıkarın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side: General Profile Card & Security Status */}
                <div className="space-y-6 md:col-span-1">
                    <div className="rp-card p-6 border-l-4 border-l-teal-600 bg-white">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-700 text-lg uppercase shadow-sm">
                                {user?.fullName?.substring(0, 2) || user?.username?.substring(0, 2) || 'RP'}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 leading-snug">{user?.fullName || 'Sistem Kullanıcısı'}</h3>
                                <p className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                    {user?.role === 'ADMIN' ? 'Yönetici' : user?.role === 'MANAGER' ? 'Müdür' : 'Operatör'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3.5 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Kullanıcı Adı:</span>
                                <span className="font-bold text-slate-900">{user?.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Hesap Durumu:</span>
                                <span className="font-bold text-teal-600 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span> Aktif
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="rp-card p-6 bg-white space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-50">
                            <Bell className="h-5 w-5 text-teal-600" />
                            <h3 className="text-sm font-bold text-slate-900">Bildirim Tercihleri</h3>
                        </div>
                        <div className="space-y-4">
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

                {/* Right Side: Security, 2FA Wizard, & Password Change */}
                <div className="md:col-span-2 space-y-6">
                    {/* 2FA Security Center */}
                    <div className={`rp-card p-6 bg-white border-l-4 ${user?.twoFactorEnabled ? 'border-l-teal-600' : 'border-l-slate-400'}`}>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${user?.twoFactorEnabled ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-500'}`}>
                                    <Shield className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">İki Adımlı Doğrulama (2FA)</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Google Authenticator uygulamasını bağlayarak hesabınızı siber saldırılara karşı koruyun.</p>
                                </div>
                            </div>
                            
                            <div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                    user?.twoFactorEnabled 
                                    ? 'bg-teal-100 text-teal-800' 
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${user?.twoFactorEnabled ? 'bg-teal-500' : 'bg-slate-500'}`}></span>
                                    {user?.twoFactorEnabled ? 'Aktif Korumalı' : 'Devre Dışı'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100">
                            {!user?.twoFactorEnabled ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 rounded-xl p-4 flex gap-3 text-xs text-slate-600 leading-relaxed border border-slate-100">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span>
                                            <strong>Önemli Uyarı:</strong> İki adımlı doğrulama devre dışıyken, şifrenizi ele geçiren bir saldırgan doğrudan sisteme giriş yapabilir. Güvenliğiniz için bu korumayı en kısa sürede aktif etmenizi öneririz.
                                        </span>
                                    </div>
                                    <Button onClick={handleInitiate2FA} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2">
                                        <QrCode className="h-4 w-4" /> 2FA Kurulumunu Başlat
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {!showDisableForm ? (
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold bg-teal-50/50 p-3 rounded-lg border border-teal-100/50">
                                                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                                                <span>Google Authenticator koruması aktif. Her girişte sizden 6 haneli kod istenecektir.</span>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setShowDisableForm(true)}
                                                className="border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                                            >
                                                Korumayı Kaldır
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-red-50/40 rounded-xl p-4 border border-red-100 space-y-4">
                                            <h4 className="text-xs font-bold text-red-800 flex items-center gap-2">
                                                <Lock className="h-4 w-4 text-red-600" /> Güvenlik Teyidi: 2FA Devre Dışı Bırakılsın Mı?
                                            </h4>
                                            <p className="text-xs text-red-700 leading-relaxed">
                                                2FA korumasını devre dışı bırakmak hesabınızın güvenliğini azaltacaktır. Bu işlemi onaylamak için lütfen hesap şifrenizi girin.
                                            </p>
                                            <div className="flex gap-3 max-w-md items-end">
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-red-800">Hesap Şifresi</Label>
                                                    <Input 
                                                        type="password" 
                                                        value={disablePassword}
                                                        onChange={(e) => setDisablePassword(e.target.value)}
                                                        placeholder="Mevcut şifreniz"
                                                        className="bg-white border-red-200 focus:border-red-500"
                                                    />
                                                </div>
                                                <Button 
                                                    onClick={handleDisable2FA} 
                                                    disabled={disabling}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                                                >
                                                    {disabling ? 'Kaldırılıyor...' : 'Korumayı Kaldır'}
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    onClick={() => { setShowDisableForm(false); setDisablePassword(''); }}
                                                    className="text-slate-500 hover:bg-slate-100"
                                                >
                                                    İptal
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="rp-rp-card rp-card p-6 bg-white space-y-5">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-50">
                            <Key className="h-5 w-5 text-teal-600" />
                            <h3 className="text-sm font-bold text-slate-900">Şifre Değiştir</h3>
                        </div>
                        <form onSubmit={handleSubmit(onChangePassword)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 sm:col-span-2">
                                <Label>Mevcut Şifre</Label>
                                <Input type="password" {...register('currentPassword', { required: true })} placeholder="Mevcut şifreniz" className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label>Yeni Şifre</Label>
                                <Input type="password" {...register('newPassword', { required: true, minLength: 6 })} placeholder="En az 6 karakter" className="bg-white" />
                                {errors.newPassword?.type === 'minLength' && (
                                    <p style={{ fontSize: 11, color: 'var(--danger)' }} className="mt-0.5">En az 6 karakter olmalı</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label>Yeni Şifre (Tekrar)</Label>
                                <Input type="password" {...register('confirmPassword', { required: true })} placeholder="Yeni şifrenizi tekrar girin" className="bg-white" />
                            </div>
                            <div className="pt-2 sm:col-span-2">
                                <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                                    {isSubmitting ? 'Şifre Değiştiriliyor...' : 'Şifreyi Değiştir'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* 2FA Setup Modal Overlay */}
            {is2faModalOpen && setupData && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-teal-600" /> İki Adımlı Doğrulama Kurulum Sihirbazı
                            </h3>
                            {setupStep !== 3 && (
                                <button 
                                    onClick={() => setIs2faModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* Wizard Progress Indicator */}
                        <div className="px-6 pt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                            <span className={setupStep >= 1 ? 'text-teal-600 font-bold' : ''}>1. QR Kod Tara</span>
                            <div className={`h-[2px] flex-1 mx-2 ${setupStep >= 2 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
                            <span className={setupStep >= 2 ? 'text-teal-600 font-bold' : ''}>2. Doğrulama</span>
                            <div className={`h-[2px] flex-1 mx-2 ${setupStep >= 3 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
                            <span className={setupStep >= 3 ? 'text-teal-600 font-bold' : ''}>3. Kurtarma Kodları</span>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* Step 1: Scan QR */}
                            {setupStep === 1 && (
                                <div className="space-y-4 text-center sm:text-left">
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Telefonunuzdan <strong>Google Authenticator</strong>, <strong>Authy</strong> veya herhangi bir TOTP uygulamasını açıp aşağıdaki QR kodunu taratın.
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                                        <div className="p-2 border border-slate-200/80 bg-white rounded-xl shadow-sm inline-block">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                                                alt="OTP QR Code" 
                                                className="h-36 w-36"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-3 w-full">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alternatif Manuel Kurulum Kodu</span>
                                            <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-xs text-slate-800 justify-between select-all">
                                                <span>{setupData.secret}</span>
                                                <button 
                                                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                                                    className="text-slate-400 hover:text-teal-600 transition p-1 rounded hover:bg-slate-100 shrink-0"
                                                >
                                                    {copiedSecret ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-normal">
                                                Uygulamanız QR kodunu okumuyorsa, yukarıdaki kodu manuel girip hesap adı olarak <strong>RingPlanner</strong> yazabilirsiniz.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                                        <Button onClick={() => setSetupStep(2)} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                                            Kodu Okuttum, Sonraki Adım →
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Verification */}
                            {setupStep === 2 && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 leading-relaxed text-center">
                                        Telefonunuzdaki TOTP uygulamasında oluşturulan <strong>6 haneli doğrulama kodunu</strong> aşağıdaki alana girerek kurulumu tamamlayın.
                                    </p>

                                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                                        <div className="w-56">
                                            <Input 
                                                type="text" 
                                                value={totpCode}
                                                maxLength={6}
                                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000 000"
                                                className="text-center text-2xl font-bold tracking-widest font-mono h-14 bg-slate-50 border-slate-200 focus:border-teal-500 focus:bg-white"
                                            />
                                        </div>
                                        <span className="text-[11px] text-slate-400">Kod her 30 saniyede bir güncellenir.</span>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex justify-between">
                                        <Button variant="ghost" onClick={() => setSetupStep(1)} className="text-slate-500 hover:bg-slate-100">
                                            ← Geri Dön
                                        </Button>
                                        <Button 
                                            onClick={handleVerifyAndEnable} 
                                            disabled={totpCode.length !== 6 || verifying2fa}
                                            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
                                        >
                                            {verifying2fa ? 'Doğrulanıyor...' : 'Kodu Doğrula ve Aktifleştir'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Backup/Recovery Codes */}
                            {setupStep === 3 && (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center text-center space-y-2 pb-2">
                                        <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                                            <CheckCircle2 className="h-7 w-7" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">Kurulum Tamamlandı!</h4>
                                        <p className="text-xs text-slate-500 max-w-sm">
                                            İki adımlı koruma başarıyla etkinleştirildi. Aşağıdaki kurtarma kodlarını mutlaka güvenli bir yerde saklayın.
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex gap-2.5 text-[11px] text-amber-800 leading-normal">
                                        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                                        <span>
                                            <strong>Önemli Güvenlik Tedbiri:</strong> Telefonunuzu kaybetmeniz durumunda sisteme giriş yapabilmek için bu kodları kullanabilirsiniz. Her bir kurtarma kodu <strong>sadece bir kez</strong> kullanılabilir.
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 py-2">
                                        {recoveryCodes.map((code, idx) => (
                                            <div 
                                                key={code} 
                                                onClick={() => copyToClipboard(code, idx)}
                                                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition p-2.5 rounded-lg border border-slate-100 font-mono text-xs text-slate-800 cursor-pointer select-all"
                                            >
                                                <span>{code}</span>
                                                <span className="text-slate-400 shrink-0">
                                                    {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                                        <Button 
                                            onClick={() => setIs2faModalOpen(false)}
                                            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                                        >
                                            Sihirbazı Tamamla ve Kapat
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ToggleRow({ label, description, checked, onChange }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }} className="mt-0.5">{description}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                style={{
                    width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: checked ? 'var(--accent)' : 'var(--border-strong)',
                    position: 'relative', transition: 'background 0.2s',
                }}
            >
                <span style={{
                    position: 'absolute', top: 2, left: checked ? 22 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }} />
            </button>
        </div>
    );
}
