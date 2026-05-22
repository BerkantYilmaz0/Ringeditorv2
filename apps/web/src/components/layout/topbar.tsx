'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { logout } from '@/lib/auth';

interface TopbarProps {
    username?: string;
}

export default function Topbar({ username = 'Admin' }: TopbarProps) {
    const router = useRouter();
    const [time, setTime] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchVal, setSearchVal] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchVal.trim()) {
            router.push(`/schedules?q=${encodeURIComponent(searchVal.trim())}`);
            setSearchVal('');
        }
        if (e.key === 'Escape') {
            setSearchVal('');
            (e.target as HTMLInputElement).blur();
        }
    }, [searchVal, router]);

    useEffect(() => {
        function tick() {
            const now = new Date();
            setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
            setDateStr(now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    async function handleLogout() {
        setMenuOpen(false);
        await logout();
        router.push('/login');
    }

    const initials = username
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'A';

    return (
        <header className="rp-topbar">
            <div className="rp-search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    placeholder="Sefer, plaka, durak ara… (Enter)"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={handleSearch}
                />
                <span className="rp-kbd">⌘K</span>
            </div>

            <div className="rp-top-right">
                {time && (
                    <div className="rp-clock">
                        <span className="rp-clock-dot" />
                        <span className="rp-clock-time">{time}</span>
                        <span className="rp-clock-date">{dateStr}</span>
                    </div>
                )}

                <Link href="/schedules" className="rp-quick-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Yeni Sefer
                </Link>

                <div className="rp-profile" ref={menuRef}
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="rp-avatar" title={username}>
                        {initials}
                    </div>
                    <div className="rp-profile-text">
                        <div className="rp-profile-name">{username}</div>
                        <div className="rp-profile-role">Yönetici</div>
                    </div>

                    {menuOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 8,
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
                            minWidth: 160, zIndex: 100, overflow: 'hidden',
                        }}>
                            <Link
                                href="/profile"
                                onClick={() => setMenuOpen(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    width: '100%', padding: '10px 14px',
                                    background: 'transparent', border: 'none',
                                    font: 'inherit', fontSize: 13, color: 'var(--ink)',
                                    cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Profil Ayarları
                            </Link>
                            <div style={{ height: 1, background: 'var(--border)', margin: '0 8px' }} />
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    width: '100%', padding: '10px 14px',
                                    background: 'transparent', border: 'none',
                                    font: 'inherit', fontSize: 13, color: '#dc2626',
                                    cursor: 'pointer', textAlign: 'left',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Çıkış Yap
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
