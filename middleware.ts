import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 🌟 KRİTİK GÜNCELLEME: getSession yerine getUser kullanıyoruz (Güvenlik ve güncel çerezler için)
  const { data: { user } } = await supabase.auth.getUser();

  // Eğer kullanıcı /admin sayfalarına erişmeye çalışıyorsa
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 1. Durum: Kullanıcı giriş yapmamışsa direkt login sayfasına at
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Durum: Giriş yapmış ama SQL ile verdiğimiz "admin" rolü yoksa ana sayfaya/login'e postala
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=yetkisiz', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};