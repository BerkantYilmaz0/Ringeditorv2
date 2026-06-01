'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { login, verify2FA } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';

export default function LoginForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // 2FA Auth State
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [preAuthToken, setPreAuthToken] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            try {
                if (twoFactorRequired) {
                    if (twoFactorCode.length !== 6) {
                        setError('Lütfen 6 haneli doğrulama kodunu tam olarak girin.');
                        return;
                    }
                    await verify2FA(preAuthToken, twoFactorCode);
                    router.push('/dashboard');
                } else {
                    const res = await login(formData.username, formData.password);
                    if (res.twoFactorRequired && res.preAuthToken) {
                        setTwoFactorRequired(true);
                        setPreAuthToken(res.preAuthToken);
                        setTwoFactorCode('');
                    } else {
                        router.push('/dashboard');
                    }
                }
            } catch (err) {
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Bağlantı hatası. Lütfen tekrar deneyin.');
                }
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hata mesajı */}
            {error && (
                <div className="border border-red-500/50 bg-red-500/10 px-4 py-3">
                    <p className="text-sm text-red-500 font-mono">{error}</p>
                </div>
            )}

            {!twoFactorRequired ? (
                <>
                    {/* Kullanıcı adı */}
                    <div className="space-y-2">
                        <label
                            htmlFor="username"
                            className="text-xs font-mono text-zinc-400 uppercase tracking-wider"
                        >
                            Kullanıcı Adı
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            autoComplete="username"
                            autoFocus
                            value={formData.username}
                            onChange={handleChange}
                            disabled={isPending}
                            className="block w-full border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#D4FF00] focus:outline-none focus:ring-1 focus:ring-[#D4FF00] transition-colors disabled:opacity-50"
                            placeholder="admin"
                        />
                    </div>

                    {/* Şifre */}
                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="text-xs font-mono text-zinc-400 uppercase tracking-wider"
                        >
                            Şifre
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isPending}
                            className="block w-full border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#D4FF00] focus:outline-none focus:ring-1 focus:ring-[#D4FF00] transition-colors disabled:opacity-50"
                            placeholder="••••••••"
                        />
                    </div>
                </>
            ) : (
                <>
                    {/* 2FA Doğrulama Kodu */}
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                        <label
                            htmlFor="twoFactorCode"
                            className="text-xs font-mono text-zinc-400 uppercase tracking-wider"
                        >
                            2FA DOĞRULAMA KODU
                        </label>
                        <input
                            id="twoFactorCode"
                            name="twoFactorCode"
                            type="text"
                            required
                            maxLength={6}
                            autoFocus
                            value={twoFactorCode}
                            onChange={e => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                            disabled={isPending}
                            className="block w-full text-center tracking-[0.4em] font-mono font-bold text-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[#D4FF00] focus:outline-none focus:ring-1 focus:ring-[#D4FF00] transition-colors disabled:opacity-50"
                            placeholder="123456"
                        />
                        <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                            * Google Authenticator veya benzeri TOTP uygulamanızdaki 6 haneli doğrulama kodunu girin.
                        </p>
                    </div>
                </>
            )}

            {/* Giriş butonu */}
            <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-[#D4FF00] text-[#1A1A1A] font-bold text-sm tracking-wide uppercase hover:bg-[#A3C400] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
                {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="inline-block h-4 w-4 border-2 border-[#1A1A1A] border-t-transparent animate-spin" />
                        Doğrulanıyor...
                    </span>
                ) : twoFactorRequired ? (
                    'Kodu Doğrula ve Giriş Yap'
                ) : (
                    'Giriş Yap'
                )}
            </Button>

            {twoFactorRequired && (
                <button
                    type="button"
                    onClick={() => { setTwoFactorRequired(false); setError(null); }}
                    className="text-xs text-zinc-400 hover:text-[#D4FF00] text-center w-full block mt-3 font-mono underline cursor-pointer"
                >
                    Şifre Ekranına Geri Dön
                </button>
            )}
        </form>
    );
}
