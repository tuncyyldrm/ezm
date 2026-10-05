import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, categories, codes, uncategorized, noImage] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("product_codes").select("*", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).is("category_id", null),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).is("image_url", null),
  ]);

  const failedQuery = [products, categories, codes, uncategorized, noImage].find(result => result.error);
  if (failedQuery?.error) {
    console.error("Admin dashboard verileri yüklenemedi:", failedQuery.error);
    throw new Error("Dashboard verileri yüklenemedi. Veritabanı izinlerini kontrol edin.");
  }

  const mainStats = [
    { label: "Aktif Ürün", value: products.count || 0, color: "bg-indigo-600", icon: "📦", href: "/admin/products" },
    { label: "Kategori", value: categories.count || 0, color: "bg-violet-600", icon: "📁", href: "/admin/categories" },
  ];

  const alertStats = [
    { label: "Kategorisiz Aktif Ürün", value: uncategorized.count || 0, color: uncategorized.count ? "text-amber-600 bg-amber-50" : "text-slate-400 bg-slate-50", icon: "📁" },
    { label: "Görsel URL'si Olmayan Aktif Ürün", value: noImage.count || 0, color: noImage.count ? "text-blue-600 bg-blue-50" : "text-slate-400 bg-slate-50", icon: "🖼️" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-12 animate-in fade-in duration-300">
      
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-b border-slate-100 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Genel Bakış</h1>
          <p className="text-slate-500 text-sm">Katalog sağlığı ve veritabanı anlık durumu</p>
        </div>
        <div className="text-xs font-bold text-slate-400 font-mono bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {new Date().toLocaleTimeString('tr-TR')}
        </div>
      </div>

      {/* 1. SEVİYE: Ana Yönetim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {mainStats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all block relative overflow-hidden hover:-translate-y-1">
            <div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`} />
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{stat.icon}</div>
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stat.value.toLocaleString('tr-TR')}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{stat.label}</p>
          </Link>
        ))}

        {/* Bilgi Kartı: OEM/Muadil Endeksi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden select-none">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-4xl font-black text-slate-950/40 tracking-tight">{(codes.count || 0).toLocaleString('tr-TR')}</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Kayıtlı OEM / Muadil</p>
        </div>
      </div>

      {/* Uyarı/İşlem Durumları */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Uyarı Durumları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertStats.map((stat) => (
            <div key={stat.label} className={`p-4 rounded-2xl border border-slate-100 ${stat.color}`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-black text-slate-900">{stat.value.toLocaleString("tr-TR")}</div>
              <p className="text-xs font-bold uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hızlı Aksiyon Kısayolları */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/products/new" className="flex items-center justify-between p-4 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <span className="flex items-center gap-2">📦 Yeni Ürün Tanımla</span>
            <span>➔</span>
          </Link>
          <Link href="/admin/categories" className="flex items-center justify-between p-4 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-950 transition-all shadow-md">
            <span className="flex items-center gap-2">📁 Kategori Ağacını Düzenle</span>
            <span>➔</span>
          </Link>
        </div>
      </div>

    </div>
  );
}