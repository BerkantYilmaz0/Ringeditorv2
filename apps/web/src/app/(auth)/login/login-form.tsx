'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { login } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';

export default function LoginForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

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
                await login(formData.username, formData.password);
                router.push('/dashboard');
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

            {/* Giriş butonu */}
            <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-[#D4FF00] text-[#1A1A1A] font-bold text-sm tracking-wide uppercase hover:bg-[#A3C400] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
                {isPending ? (
                    <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 border-2 border-[#1A1A1A] border-t-transparent animate-spin" />
                        Doğrulanıyor...
                    </span>
                ) : (
                    'Giriş Yap'
                )}
            </Button>
        </form>
    );
}
