'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { logout } from '@/lib/auth';
import Sidebar from './sidebar';

interface TopbarProps {
    username?: string;
}

export default function Topbar({ username = 'Admin' }: TopbarProps) {
    const router = useRouter();

    async function handleLogout() {
        await logout();
        router.push('/login');
    }

    // kullanıcı adının baş harfleri
    const initials = username
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-100/60 bg-white px-6">
            {/* mobil menü butonu */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-56 p-0 border-none">
                        <Sidebar />
                    </SheetContent>
                </Sheet>
            </div>

            {/* boşluk — breadcrumb buraya eklenebilir */}
            <div className="flex-1" />

            {/* kullanıcı menüsü */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors outline-none cursor-pointer">
                        <span className="hidden sm:block text-sm text-slate-700 font-semibold text-right">
                            <span className="block">{username}</span>
                            <span className="block text-xs font-normal text-slate-400">Yönetici</span>
                        </span>
                        <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                            <AvatarFallback className="bg-primary text-white text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        Profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
