// Next.js Edge Middleware — korumalı rotalara yetkilendirme kontrolü
// Not: localStorage edge'de erişilemez, bu yüzden cookie tabanlı kontrol yapıyoruz
// İlk MVP'de client-side guard kullanacağız, middleware sadece yönlendirme için

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// korumalı rotalar
const protectedPaths = ['/dashboard', '/schedules', '/jobs', '/templates', '/routes', '/stops', '/ring-types', '/devices', '/users'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('access_token');
    const refreshToken = request.cookies.get('refresh_token');

    // Root route (/) login'e yönlendir (eğer dashboard vs isteniyorsa ayarlanabilir)
    if (pathname === '/') {
        if (accessToken) {
            return NextResponse.redirect(new URL('/schedules', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Login sayfasındaysa ve token varsa içeri sok
    if (pathname === '/login' && accessToken) {
        return NextResponse.redirect(new URL('/schedules', request.url));
    }

    // korumalı rota kontrolü
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));

    if (isProtected && !accessToken && !refreshToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
