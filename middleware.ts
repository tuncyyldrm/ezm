import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 🌟 1. ADIM: Güvenli değişken kontrolü (Build ve Runtime koruması)
// middleware.ts dosyasının en üstündeki o satırları şununla değiştir:
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://placeholder-project.supabase.co';

const supabaseAnonKey = 
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybnR5c21od2Z4a3J0ZWdpcmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjkxMTUsImV4cCI6MjA5NjM0NTExNX0.LZi6sW4OVa8bLMj_et8PSxiG6LHxeY-oSB2gm696D5U';

  // İlk başta boş bir response oluşturuyoruz
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Supabase sunucu istemcisini oluşturuyoruz
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Next.js 16+ uyumluluğu için çerezleri hem request hem response'a güvenli şekilde dağıtıyoruz
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

  // Sahte link aktifse (yani Vercel değişkenleri henüz bağlamadıysa) middleware'i güvenle bypass et
  if (supabaseUrl.includes('placeholder-project')) {
    return response;
  }

  // 🌟 Kullanıcı kontrolü
  const { data: { user } } = await supabase.auth.getUser();

  // Eğer kullanıcı /admin sayfalarına erişmeye çalışıyorsa
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 1. Durum: Kullanıcı giriş yapmamışsa login sayfasına at
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Durum: Giriş yapmış ama "admin" rolü yoksa login'e postala
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=yetkisiz', request.url));
    }
  }

  return response;
}

export const config = {
  // Middleware'in gereksiz yere statik varlıklarda çalışıp sunucuyu yormasını engelliyoruz
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};