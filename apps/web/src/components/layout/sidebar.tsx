'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

function I(path: string) {
    return function Icon() {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };
}

const IconDashboard = I('M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z');
const IconCalendar  = I('M4 7h16M8 3v4M16 3v4M5 7h14v13H5z');
const IconCopy      = I('M9 4h9v13H9zM6 7v13h10');
const IconBus       = I('M4 7a2 2 0 012-2h12a2 2 0 012 2v9H4zM4 16v2h3v-2M17 16v2h3v-2M4 11h16');
const IconRing      = I('M12 4a8 8 0 108 8');
const IconRoute     = I('M6 6a2 2 0 100 4 2 2 0 000-4zM18 14a2 2 0 100 4 2 2 0 000-4zM8 8h6a4 4 0 014 4v0');
const IconPin       = I('M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z');
const IconPerson    = I('M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c0-4 3.6-7 8-7s8 3 8 7');
const IconUsers     = I('M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75');
const IconChart     = I('M3 3v18h18M7 16l4-4 4 4 4-6');
const IconActivity  = I('M22 12h-4l-3 9L9 3l-3 9H2');

const navGroups = [
    {
        label: 'Genel',
        items: [{ href: '/dashboard', name: 'Dashboard', icon: IconDashboard }],
    },
    {
        label: 'Operasyon',
        items: [
            { href: '/schedules', name: 'Sefer Planlama', icon: IconCalendar },
            { href: '/templates', name: 'Şablonlar', icon: IconCopy },
        ],
    },
    {
        label: 'Araç Yönetimi',
        items: [
            { href: '/devices', name: 'Araçlar', icon: IconBus },
            { href: '/drivers', name: 'Sürücüler', icon: IconPerson },
            { href: '/ring-types', name: 'Ring Tipleri', icon: IconRing },
        ],
    },
    {
        label: 'Altyapı',
        items: [
            { href: '/routes', name: 'Hat Yönetimi', icon: IconRoute },
            { href: '/stops', name: 'Durak Yönetimi', icon: IconPin },
        ],
    },
    {
        label: 'Raporlar & Yönetim',
        items: [
            { href: '/reports', name: 'Raporlar', icon: IconChart },
            { href: '/users', name: 'Kullanıcılar', icon: IconUsers },
            { href: '/activity', name: 'Aktivite Geçmişi', icon: IconActivity },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`rp-side ${collapsed ? 'is-collapsed' : ''}`}>
            <div className="rp-brand">
                <div className="rp-brand-mark">
                    <span className="rp-brand-ring" />
                </div>
                {!collapsed && (
                    <div className="rp-brand-text">
                        <span className="rp-brand-1">Ring</span>
                        <span className="rp-brand-2">Planner</span>
                    </div>
                )}
            </div>

            <nav className="rp-nav">
                {navGroups.map((group) => (
                    <div key={group.label} className="rp-nav-group">
                        {!collapsed && <div className="rp-nav-label">{group.label}</div>}
                        {group.items.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rp-nav-item ${isActive ? 'is-active' : ''}`}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <Icon />
                                    {!collapsed && <span className="rp-nav-name">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="rp-side-foot">
                <button
                    className="rp-collapse-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Menüyü aç' : 'Menüyü daralt'}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                            d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
        </aside>
    );
}

