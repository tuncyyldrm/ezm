"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// Güncellediğimiz ortak supabase istemcisini import ediyoruz
import { supabase } from "@/lib/supabase"; 

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Ürünler", icon: "📦" },
  { href: "/admin/categories", label: "Kategoriler", icon: "📁" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false); // Mobil menü durumu
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
    <div className="flex min-h-screen bg-slate-50">
      {/* MOBIL HEADER (Sadece mobilde görünür) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-950 text-white w-full fixed top-0 z-50">
        <span className="font-bold">Admin Panel</span>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-2xl">
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-200 p-5 flex flex-col transform transition-transform lg:translate-x-0 ${isOpen ? "translate-x-0 pt-16" : "-translate-x-full"}`}>
        
        <nav className="space-y-1.5 flex-1 mt-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive(item.href) ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-900 mt-auto space-y-1">
          {/* type="button" eklenerek form dışı buton davranışı kesinleştirildi */}
          <button 
            type="button" 
            onClick={handleLogout} 
            className="w-full text-left text-red-400 p-4 hover:bg-red-950/30 rounded-xl transition-colors font-semibold"
          >
            ❌ Çıkış
          </button>
          <Link href="/" className="block p-4 text-slate-500 hover:text-slate-200 transition-colors">
            ← Mağaza
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 lg:p-12 lg:ml-64 mt-16 lg:mt-0 w-full overflow-auto">
        {children}
      </main>

      {/* MOBİL KARARTMA (Overlay) */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />
      )}
    </div>
  );
}