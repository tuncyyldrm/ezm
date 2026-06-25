"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Ürünler", icon: "📦" },
  { href: "/admin/categories", label: "Kategoriler", icon: "📁" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Aktif sayfa mantığı - alt kırılımları da (örn: /products/new) doğru yakalar
  const isActive = (href: string) => 
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Güvenli Çıkış İşlemi
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh(); // Middleware'in oturumun kapandığını hemen anlaması için şart
    } catch (err) {
      console.error("Çıkış yapılırken hata oluştu:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-950 text-slate-200 p-5 flex flex-col gap-1 border-r border-slate-900 shadow-xl shrink-0">
        {/* Logo / Başlık */}
        <Link href="/admin" className="flex items-center gap-2.5 text-base font-bold px-4 py-3 mb-6 text-white hover:text-indigo-400 transition-colors border-b border-slate-900 pb-5 tracking-tight">
          <span className="text-xl">⚙️</span> Admin
        </Link>
        
        {/* Navigasyon Linkleri */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <span className={`text-lg transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Alt Kısım: Çıkış Yap ve Siteye Dönüş */}
        <div className="pt-4 border-t border-slate-900 mt-auto space-y-1">
          {/* Güvenli Çıkış Butonu */}
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-400 hover:text-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-red-950/30 transition-all cursor-pointer"
          >
            ❌ Güvenli Çıkış
          </button>

          {/* Mağazaya Dönüş */}
          <Link 
            href="/" 
            className="text-slate-500 hover:text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-all"
          >
            ← Mağazaya Dön
          </Link>
        </div>
      </aside>

      {/* MAİN CONTENT */}
      <main className="flex-1 p-8 lg:p-12 overflow-auto max-w-7xl mx-auto w-full">
        {children}
      </main>

    </div>
  );
}