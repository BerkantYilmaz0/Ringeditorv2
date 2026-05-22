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
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f6f7f9', fontFamily: '"Manrope", sans-serif' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #0d9488', borderTopColor: 'transparent', animation: 'rp-spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Yükleniyor…</span>
                    <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="rp">
            <Sidebar />
            <main className="rp-main">
                <Topbar username={username} />
                <div className="rp-scroll">
                    {children}
                </div>
            </main>
        </div>
    );
}
