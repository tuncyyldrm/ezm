// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// 🌟 1. ADIM: Next.js derleyicisine bu sayfayı statik olarak üretmemesini söylüyoruz
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 🌟 2. ADIM: Build anında değişkenler boş gelse bile çökmesini engellemek için yedek (fallback) ekliyoruz
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('Giriş bilgileri hatalı veya yetkiniz yok.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Bu panele erişim yetkiniz bulunmamaktadır.');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-black text-gray-950 tracking-tight">
            Admin Paneli Girişi
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Yönetim paneline erişmek için bilgilerinizi giriniz.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100 font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                E-Posta Adresi
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                placeholder="admin@firma.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Giriş Yap'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}