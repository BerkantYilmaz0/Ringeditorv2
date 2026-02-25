import LoginForm from './login-form';

export const metadata = {
    title: 'Giriş Yap | Ring Planner',
    description: 'Ring Planner yönetim panelinize giriş yapın.',
};

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen w-full overflow-hidden bg-zinc-950 text-zinc-50">

            {/* Sol: Devasa tipografik element */}
            <div className="hidden lg:flex lg:flex-1 items-center justify-center relative select-none">
                {/* Arka plan: dev yazı */}
                <div className="absolute inset-0 flex flex-col justify-center px-12 pointer-events-none">
                    <span
                        className="text-[12vw] font-black leading-[0.85] tracking-[-0.06em] text-white/[0.04] uppercase"
                        aria-hidden="true"
                    >
                        RING
                    </span>
                    <span
                        className="text-[12vw] font-black leading-[0.85] tracking-[-0.06em] text-white/[0.04] uppercase"
                        aria-hidden="true"
                    >
                        PLANNER
                    </span>
                </div>

                {/* Öndeki bilgi bloğu */}
                <div className="relative z-10 max-w-md px-12">
                    <div className="mb-8">
                        <div className="inline-block border border-[#D4FF00]/30 px-3 py-1 mb-6">
                            <span className="text-[#D4FF00] text-xs font-mono tracking-widest uppercase">
                                v0.1.0
                            </span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white leading-none mb-4">
                            Ring
                            <br />
                            <span className="text-[#D4FF00]">Planner</span>
                        </h1>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Kurumsal sefer yönetim sistemi.
                            <br />
                            Araç, güzergah ve sefer planlamasını dijitalleştirin.
                        </p>
                    </div>

                    {/* Alt bilgi çizgileri */}
                    <div className="space-y-2 border-t border-zinc-800 pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px w-4 bg-[#D4FF00]" />
                            <span className="text-xs text-zinc-400 font-mono">
                                Güzergah Optimizasyonu
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-px w-4 bg-[#D4FF00]" />
                            <span className="text-xs text-zinc-400 font-mono">
                                Sefer Çakışma Kontrolü
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-px w-4 bg-[#D4FF00]" />
                            <span className="text-xs text-zinc-400 font-mono">
                                Harita Entegrasyonu
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dikey ayırıcı çizgi */}
            <div className="hidden lg:block w-px bg-[#D4FF00]/20 self-stretch" />

            {/* Sağ: Login formu (dar panel) */}
            <div className="flex w-full lg:w-[420px] xl:w-[460px] flex-col justify-center px-8 sm:px-12 lg:px-10">
                <div className="w-full max-w-sm mx-auto">
                    {/* Mobil logo */}
                    <div className="lg:hidden mb-10">
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            Ring <span className="text-[#D4FF00]">Planner</span>
                        </h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-lg font-bold tracking-tight text-white">
                            Giriş Yap
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            Yönetim paneline erişmek için kimlik bilgilerinizi girin.
                        </p>
                    </div>

                    <LoginForm />

                    {/* Alt çizgi */}
                    <div className="mt-12 pt-6 border-t border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-mono text-center uppercase tracking-widest">
                            Ring Planner © 2025
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
