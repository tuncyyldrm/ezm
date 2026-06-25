import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 🌟 1. ADIM: Güvenli değişken kontrolü (Build ve Runtime koruması)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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