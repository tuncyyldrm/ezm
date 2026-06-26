// app/admin/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BUCKET_URL = "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images";
const PAGE_SIZE = 20;

const storage = {
  get: (key: string) => typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem(key) || "null") : null,
  set: (key: string, val: any) => typeof window !== "undefined" && sessionStorage.setItem(key, JSON.stringify(val))
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [search, setSearch] = useState(() => storage.get("p_search") || "");
  const [catFilter, setCatFilter] = useState(() => storage.get("p_cat") || "");
  const [statusFilter, setStatusFilter] = useState(() => storage.get("p_status") || "");
  const [page, setPage] = useState(() => storage.get("p_page") || 0);

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => setCategories(data || []));
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      storage.set("p_scroll", window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    storage.set("p_search", search);
    storage.set("p_cat", catFilter);
    storage.set("p_status", statusFilter);
    storage.set("p_page", page);
  }, [search, catFilter, statusFilter, page]);

  useEffect(() => {
    setPage(0);
    loadProducts(0, true);
  }, [search, catFilter, statusFilter]);

const loadProducts = async (pageNum: number, reset = false) => {
    // .order() kısmını "sku" olarak güncelledik (A'dan Z'ye sıralama için ascending: true)
    let query = supabase.from("products").select(`
      *, categories(id, name), product_codes(id, code_value, code_type), product_vehicles(id, brands(name))
    `, { count: "exact" }).order("sku", { ascending: true });

    if (search) query = query.or(`title.ilike.%${search}%,sku.ilike.%${search}%`);
    if (catFilter) query = query.eq("category_id", catFilter);
    if (statusFilter === "active") query = query.eq("is_active", true);
    if (statusFilter === "passive") query = query.eq("is_active", false);

    // Eğer reset true ise sıfırıncı sayfadan başla, değilse gelen pageNum'ı kullan
    const currentPage = reset ? 0 : pageNum;
    const start = currentPage * PAGE_SIZE;
    const end = (currentPage + 1) * PAGE_SIZE - 1;

    const { data, count } = await query.range(start, end);

    setProducts(prev => reset ? (data || []) : [...prev, ...(data || [])]);
    setTotalCount(count || 0);
    setHasMore((currentPage + 1) * PAGE_SIZE < (count || 0));

    if (reset && data?.length) {
      const savedScroll = storage.get("p_scroll");
      if (savedScroll) setTimeout(() => window.scrollTo({ top: savedScroll, behavior: "instant" }), 50);
    }
  };

  const handleDelete = async (prod: any) => {
    if (!confirm(`${prod.title} silinsin mi?`)) return;
    await supabase.storage.from("product-images").remove(['jpg', 'jpeg', 'png', 'webp'].map(ext => `${prod.sku}.${ext}`));
    await supabase.from("products").delete().eq("id", prod.id);
    loadProducts(0, true);
  };

  const navigateTo = (path: string) => {
    storage.set("p_scroll", window.scrollY);
    router.push(path);
  };

  const inputStyle = "px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium shadow-sm text-sm";
  const thStyle = "px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70";

  return (
    <div className="bg-slate-50 min-h-screen pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between py-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ürün Listesi</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Parça stoklarını, referans kodlarını ve uyumlulukları yönetin</p>
        </div>
        <button onClick={() => navigateTo("/admin/products/new")} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2 text-sm">
          <span className="text-base">+</span> Yeni Ürün Ekle
        </button>
      </div>

      {/* Filtre Barı */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input type="text" placeholder="🔍 Başlık veya SKU kodu ara..." value={search} onChange={e => setSearch(e.target.value)} className={inputStyle} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={inputStyle}>
          <option value="">📁 Tüm Kategoriler</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputStyle}>
          <option value="">📊 Tüm Durumlar</option>
          <option value="active">🟢 Aktif Satışta</option>
          <option value="passive">🔴 Pasif / Gizli</option>
        </select>
      </div>

      {/* Liste Gösterimi */}
      {products.length === 0 && !hasMore ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium mb-3">Aranan kriterlere uygun ürün bulunamadı.</p>
          <button onClick={() => { setSearch(""); setCatFilter(""); setStatusFilter(""); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Filtreleri Sıfırla</button>
        </div>
      ) : (
        <>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{products.length} / {totalCount} Ürün Listeleniyor</div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">{["Ürün Detayı", "SKU", "Kategori", "Uyumlu Marka", "Pin", "Durum", "İşlem"].map((h, i) => <th key={i} className={`${thStyle} ${i === 4 || i === 5 ? "text-center" : i === 6 ? "text-right" : ""}`}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                            <img src={`${BUCKET_URL}/${p.sku}.jpg`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const pr = (e.target as HTMLImageElement).parentElement; if (pr) pr.innerHTML = '<span class="text-xl">📦</span>'; }} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{p.title}</div>
                            {p.product_codes?.length > 0 && (
                              <div className="flex gap-1.5 mt-1 flex-wrap">
                                {p.product_codes.slice(0, 2).map((c: any) => <span key={c.id} className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">{c.code_type}: {c.code_value}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg tracking-wider">{p.sku}</span></td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{p.categories?.name || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {p.product_vehicles?.length ? p.product_vehicles.slice(0, 2).map((pv: any) => <span key={pv.id} className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-lg border border-indigo-100/50">{pv.brands?.name}</span>) : <span className="text-slate-300">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-slate-600">{p.pin_count || "0"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span> {p.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigateTo(`/admin/products/new?id=${p.id}`)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">✏️</button>
                          <button onClick={() => handleDelete(p)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button onClick={() => { const n = page + 1; setPage(n); loadProducts(n); }} className="px-6 py-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 text-slate-600 font-bold text-sm transition shadow-sm">
                Daha Fazla Parça Yükle ({totalCount - products.length})
              </button>
            </div>
          )}
        </>
      )}

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 w-11 h-11 bg-slate-900 text-white rounded-full shadow-xl hover:bg-indigo-600 transition flex items-center justify-center text-base font-bold z-50">↑</button>
      )}
    </div>
  );
}