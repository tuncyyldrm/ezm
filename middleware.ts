// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    'https://erntysmhwfxkrtegirds.supabase.co'; // Kendi URL'iniz yedek olarak kalabilir

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
          // Çerezleri hem isteğe hem yanıta güvenli bir şekilde mutasyona uğratarak dağıtıyoruz
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          
          // Mevcut response nesnesini koruyarak çerezleri üzerine yazıyoruz (Sıfırlama yapmıyoruz)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Kullanıcı kontrolü (Bu metot arka planda token süresi bittiyse otomatik refresh tetikler ve setAll çalışır)
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 4. ADMIN PANELİ KORUMASI
  if (pathname.startsWith('/admin')) {
    
    // Durum A: Kullanıcı oturum açmamış
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      // Kullanıcıyı yönlendirirken güncellenmiş çerezleri (varsa) kaybetmemek için response.cookies'i klonluyoruz
      return NextResponse.redirect(loginUrl, { headers: response.headers });
    }

    // Durum B: Oturum var ama admin rolü yok
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      const unauthorizedUrl = new URL('/login?error=yetkisiz', request.url);
      return NextResponse.redirect(unauthorizedUrl, { headers: response.headers });
    }
  }

  // 5. ZATEN GİRİŞ YAPMIŞ ADMİNİ /LOGIN SAYFASINDAN /ADMIN'E LOGİN DÖNGÜSÜNDEN KURTARMA
  if (pathname === '/login' && user && user.user_metadata?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url), { headers: response.headers });
  }

  return response;
}

export const config = {
  // sitemap.xml yerine sitemap olarak güncellendi
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap|robots.txt).*)',
  ],
};