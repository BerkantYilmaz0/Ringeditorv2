'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Bus,
    MapPin,
    Route,
    CalendarDays,
    FileStack,
    Palette,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// navigasyon grupları
const navGroups = [
    {
        title: 'GENEL',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'OPERASYON',
        items: [
            { href: '/schedules', label: 'Sefer Planlama', icon: CalendarDays },
            { href: '/templates', label: 'Şablonlar', icon: FileStack },
        ]
    },
    {
        title: 'ARAÇ YÖNETİMİ',
        items: [
            { href: '/devices', label: 'Araçlar', icon: Bus },
            { href: '/ring-types', label: 'Ring Tipleri', icon: Palette },
        ]
    },
    {
        title: 'ALTYAPI',
        items: [
            { href: '/routes', label: 'Hat Yönetimi', icon: Route },
            { href: '/stops', label: 'Durak Yönetimi', icon: MapPin },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <TooltipProvider delayDuration={0}>
            <aside className={`relative flex flex-col border-r border-slate-100 shadow-[2px_0_10px_-3px_rgba(0,0,0,0.03)] bg-white text-slate-700 transition-all duration-300 z-10 ${collapsed ? 'w-20' : 'w-64'
                }`}
            >
                {/* logo */}
                <div className="flex h-16 items-center px-6 border-b border-slate-100/60">
                    {!collapsed && (
                        <Link href="/dashboard" className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-xl font-bold tracking-tight text-primary">
                                Ring <span className="text-slate-800">Planner</span>
                            </span>
                        </Link>
                    )}
                    {collapsed && (
                        <Link href="/dashboard" className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <span className="text-sm font-bold text-primary">RP</span>
                        </Link>
                    )}
                </div>

                {/* navigasyon */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
                    {navGroups.map((group, groupIdx) => (
                        <div key={group.title || groupIdx} className="space-y-1">
                            {!collapsed && (
                                <h3 className="px-4 text-[11px] font-bold tracking-wider text-slate-400 mb-2">
                                    {group.title}
                                </h3>
                            )}
                            {group.items.map(item => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                const Icon = item.icon;

                                const linkContent = (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] transition-all relative ${isActive
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                                            } ${collapsed ? 'justify-center' : ''}`}
                                    >
                                        {isActive && !collapsed && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md" />
                                        )}
                                        <Icon className={`shrink-0 ${isActive ? 'text-primary' : 'text-slate-400'} ${collapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                                        {!collapsed && <span>{item.label}</span>}
                                    </Link>
                                );

                                if (collapsed) {
                                    return (
                                        <Tooltip key={item.href}>
                                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                            <TooltipContent side="right" className="bg-card text-card-foreground border-border">
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                }

                                return linkContent;
                            })}
                        </div>
                    ))}
                </nav>

                <Separator />

                {/* sidebar daralt/genişlet butonu */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center h-10 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </aside>
        </TooltipProvider>
    );
}
