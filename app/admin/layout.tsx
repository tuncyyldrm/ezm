"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// Güncellediğimiz ortak supabase istemcisini import ediyoruz
import { supabase } from "@/lib/supabase"; 

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Ürünler", icon: "📦" },
  { href: "/admin/categories", label: "Kategoriler", icon: "📁" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/analiz", label: "Site Analizi", icon: "📈" },
  { href: "/admin/bildirimler", label: "Bildirimler", icon: "🔔" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => 
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      // Artık çerezleri temizleyen doğru istemci metodu tetikleniyor
      await supabase.auth.signOut();
      
      // Önce yönlendir, ardından router'ı yenileyerek Next.js middleware/state yapısını sıfırla
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Çıkış işlemi sırasında bir hata oluştu:", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-slate-50">
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-slate-950 px-4 text-white shadow-sm lg:hidden">
        <Link href="/admin" className="font-bold tracking-wide">
          EZM OTO <span className="font-medium text-slate-400">Admin</span>
        </Link>
        <button
          type="button"
          aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={isOpen}
          aria-controls="admin-navigation"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-xl transition hover:bg-slate-800"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      <aside
        id="admin-navigation"
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto bg-slate-950 p-5 text-slate-200 shadow-xl transition-transform duration-200 lg:sticky lg:inset-y-auto lg:left-auto lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
          isOpen ? "translate-x-0 pt-16" : "-translate-x-full"
        }`}
      >
        <Link href="/admin" className="hidden border-b border-slate-800 pb-5 text-lg font-black tracking-tight text-white lg:block">
          EZM <span className="text-indigo-400">OTO</span>
          <span className="mt-1 block text-xs font-medium tracking-normal text-slate-500">Yönetim Paneli</span>
        </Link>

        <nav aria-label="Admin menüsü" className="mt-4 flex-1 space-y-1.5">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive(item.href) ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 space-y-1 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl p-3 text-left font-semibold text-red-400 transition-colors hover:bg-red-950/30"
          >
            ❌ Çıkış
          </button>
          <Link href="/" className="block rounded-xl p-3 text-slate-500 transition-colors hover:bg-slate-900 hover:text-slate-200">
            ← Mağazaya dön
          </Link>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden px-4 pb-8 pt-[4.5rem] sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}