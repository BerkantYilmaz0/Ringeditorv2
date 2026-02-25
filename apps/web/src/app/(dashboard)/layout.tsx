'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import { getMe } from '@/lib/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // kullanıcı bilgisini al
        getMe()
            .then(user => {
                if (!user) {
                    router.replace('/login');
                    return;
                }
                setUsername(user.username);
                setLoading(false);
            })
            .catch(() => {
                router.replace('/login');
            });
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-acid border-t-transparent animate-spin" />
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        Yükleniyor...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* masaüstü sidebar */}
            <div className="hidden lg:flex">
                <Sidebar />
            </div>

            {/* ana içerik alanı */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar username={username} />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
