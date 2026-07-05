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
          // Çerezleri hem isteğe hem yanıta güvenli seçenekleriyle dağıtıyoruz
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
  const { pathname } = request.nextUrl;

  // Yönlendirme durumlarında çerezleri koruyarak güvenli yönlendirme yapan yardımcı fonksiyon
  const safeRedirect = (targetUrl: string) => {
    const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url));
    // Güncellenmiş oturum çerezlerini yönlendirme yanıtına güvenle aktarıyoruz
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // 4. ADMIN PANELİ KORUMASI
  if (pathname.startsWith('/admin')) {
    // Durum A: Kullanıcı oturum açmamış
    if (!user) {
      return safeRedirect('/login');
    }

    // Durum B: Oturum var ama admin rolü yok
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return safeRedirect('/login?error=yetkisiz');
    }
  }

  // 5. GİRİŞ YAPMIŞ KULLANICILARI LOGIN SAYFASINDAN KORUMA (Döngü Engelleme)
  if (pathname === '/login' && user) {
    const userRole = user.user_metadata?.role;
    if (userRole === 'admin') {
      return safeRedirect('/admin');
    } else {
      // Eğer normal kullanıcıysa giriş yaptıktan sonra anasayfaya yönlendir
      return safeRedirect('/');
    }
  }

  return response;
}

export const config = {
  // Statik dosyaları ve API rotalarını middleware dışında bırakıyoruz
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap|robots.txt).*)',
  ],
};