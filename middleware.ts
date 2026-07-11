// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ YENİ: Auth gerekmeyen sayfaları HEMEN geç (Supabase'i başlatma bile)
  if (
    !pathname.startsWith('/admin') && 
    pathname !== '/login'
  ) {
    return NextResponse.next();
  }

  // 👇 Bundan sonrası SADECE admin ve login sayfaları için çalışır
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    'https://erntysmhwfxkrtegirds.supabase.co';

  const supabaseAnonKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybnR5c21od2Z4a3J0ZWdpcmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjkxMTUsImV4cCI6MjA5NjM0NTExNX0.LZi6sW4OVa8bLMj_et8PSxiG6LHxeY-oSB2gm696D5U';

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const safeRedirect = (targetUrl: string) => {
    const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // ADMIN PANELİ KORUMASI
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return safeRedirect('/login');
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return safeRedirect('/login?error=yetkisiz');
    }
  }

  // LOGIN SAYFASI KORUMASI
  if (pathname === '/login' && user) {
    const userRole = user.user_metadata?.role;
    return safeRedirect(userRole === 'admin' ? '/admin' : '/');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap|robots.txt).*)',
  ],
};