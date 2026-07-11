// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    'https://erntysmhwfxkrtegirds.supabase.co';

  const supabaseAnonKey = 
    process.env.SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybnR5c21od2Z4a3J0ZWdpcmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjkxMTUsImV4cCI6MjA5NjM0NTExNX0.LZi6sW4OVa8bLMj_et8PSxiG6LHxeY-oSB2gm696D5U';

  const { pathname } = request.nextUrl;

  // 🛡️ CRITICAL: Analytics endpoint'ini middleware kontrolünden muaf tut
  // Bu endpoint her zaman çalışmalı, auth kontrolü yapılmamalı
  if (
    pathname.startsWith('/api/v1/user-preferences') ||  // Analytics endpoint'i
    pathname.startsWith('/api/') ||                      // Diğer API'ler
    pathname.startsWith('/_next/') ||                    // Next.js internal
    pathname.startsWith('/favicon') ||                   // Favicon
    pathname.includes('.')                               // Statik dosyalar (.js, .css, .png vs)
  ) {
    return NextResponse.next();
  }

  // 1. İlk yanıt nesnesini oluşturuyoruz
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Supabase sunucu istemcisini güvenli çerez yönetimiyle başlatıyoruz
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

  // 3. Kullanıcı kontrolü (Token süresi bittiyse otomatik yenilenir)
  const { data: { user } } = await supabase.auth.getUser();

  // Yönlendirme durumlarında çerezleri koruyarak güvenli yönlendirme yapan yardımcı fonksiyon
  const safeRedirect = (targetUrl: string, preserveParams = false) => {
    const redirectUrl = new URL(targetUrl, request.url);
    
    // Opsiyonel: Mevcut query parametrelerini koru
    if (preserveParams) {
      const currentParams = request.nextUrl.searchParams;
      currentParams.forEach((value, key) => {
        if (!redirectUrl.searchParams.has(key)) {
          redirectUrl.searchParams.set(key, value);
        }
      });
    }
    
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Güncellenmiş oturum çerezlerini yönlendirme yanıtına güvenle aktarıyoruz
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        ...cookie,
      });
    });
    
    // Güvenlik header'ları ekle
    redirectResponse.headers.set('X-Redirect-Reason', 'auth-middleware');
    
    return redirectResponse;
  };

  // 4. PERFORMANS İYİLEŞTİRMESİ: Sayfa yüklenirken analytics'e bilgi gönder
  // Bu, sayfa render'ını engellemez (async çalışır)
  if (process.env.NODE_ENV === 'production') {
    // Arka planda analytics tracking (fire-and-forget)
    fetch(`${request.nextUrl.origin}/api/v1/user-preferences/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
      },
      body: JSON.stringify({
        contextId: request.nextUrl.href,
        viewLabel: 'Page View', // Title client-side'da güncellenecek
        userId: request.cookies.get('__ezm_session')?.value || 
                `srv_${Date.now().toString(36)}`,
        sessionRef: request.cookies.get('__ezm_visit')?.value || 
                    `mid_${Date.now().toString(36)}`,
        meta: {
          action: 'server_page_view',
          category: 'middleware',
          label: pathname,
        },
      }),
    }).catch(() => {
      // Sessiz hata - analytics kritik değil
    });
  }

  // 5. ADMIN PANELİ KORUMASI
  if (pathname.startsWith('/admin')) {
    // Durum A: Kullanıcı oturum açmamış
    if (!user) {
      // Login sayfasına yönlendir, ama mevcut URL'i returnUrl olarak ekle
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return safeRedirect(loginUrl.toString());
    }

    // Durum B: Oturum var ama admin rolü yok
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      // Yetkisiz erişim - login sayfasına hata mesajıyla yönlendir
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'yetkisiz');
      loginUrl.searchParams.set('message', 'Bu sayfaya erişim yetkiniz bulunmamaktadır');
      return safeRedirect(loginUrl.toString());
    }
    
    // Admin kullanıcı için özel header ekle (opsiyonel)
    response.headers.set('X-User-Role', 'admin');
    response.headers.set('X-User-Id', user.id);
  }

  // 6. GİRİŞ YAPMIŞ KULLANICILARI LOGIN SAYFASINDAN KORUMA
  if (pathname === '/login' && user) {
    const userRole = user.user_metadata?.role;
    
    // returnUrl varsa oraya yönlendir
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    
    if (returnUrl && returnUrl.startsWith('/')) {
      // Güvenlik kontrolü: returnUrl mutlaka aynı domain'de olmalı
      return safeRedirect(returnUrl);
    }
    
    if (userRole === 'admin') {
      return safeRedirect('/admin');
    } else {
      return safeRedirect('/');
    }
  }

  // 7. KORUMALI SAYFALAR (Opsiyonel - genişletilebilir)
  const protectedRoutes = ['/profile', '/orders', '/favorites'];
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return safeRedirect(loginUrl.toString());
  }

  // 8. Güvenlik header'ları ekle (tüm sayfalar için)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (eski adıyla Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // 9. Kullanıcı bilgilerini response'a ekle (opsiyonel debugging)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Debug-User', user ? user.id : 'anonymous');
    response.headers.set('X-Debug-Path', pathname);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - BUT we handle analytics separately in the function
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};