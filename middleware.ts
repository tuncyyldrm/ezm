// middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables missing');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let response = NextResponse.next();

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
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Auth Error:', error.message);
  }

  // ADMIN SAYFALARI
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      );
    }

    const userRole = user.user_metadata?.role;

    if (userRole !== 'admin') {
      return NextResponse.redirect(
        new URL('/login?error=yetkisiz', request.url)
      );
    }
  }

  // LOGIN SAYFASI
  if (pathname === '/login' && user) {
    const userRole = user.user_metadata?.role;

    return NextResponse.redirect(
      new URL(
        userRole === 'admin'
          ? '/admin'
          : '/',
        request.url
      )
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
  ],
};