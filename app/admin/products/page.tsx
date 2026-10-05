"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BUCKET = "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images";
const SIZE = 20;

type CategoryOption = {
  id: number;
  name: string;
};

type ProductCode = {
  id?: number;
  code_type?: string | null;
  code_value?: string | null;
};

type ProductVehicle = {
  id?: number;
  brands?: {
    name?: string | null;
  } | null;
};

type ProductRecord = {
  id: number;
  title: string;
  sku: string;
  categories?: { name?: string | null } | null;
  product_codes?: ProductCode[] | null;
  product_vehicles?: ProductVehicle[] | null;
  pin_count?: number | null;
  is_active?: boolean | null;
  is_new?: boolean | null;
};

type ProductFilters = {
  s: string;
  c: string;
  st: string;
  isNew: string;
};

async function queryProducts(filters: ProductFilters, from: number) {
  let query = supabase.from("products")
    .select("*, categories(id,name), product_codes(id,code_value,code_type), product_vehicles(id,brands(name))", { count: "exact" })
    .order("sku");

  if (filters.s) query = query.or(`title.ilike.%${filters.s}%,sku.ilike.%${filters.s}%`);
  if (filters.c) query = query.eq("category_id", filters.c);
  if (filters.st === "active") query = query.eq("is_active", true);
  if (filters.st === "passive") query = query.eq("is_active", false);
  if (filters.isNew === "new") query = query.eq("is_new", true);
  if (filters.isNew === "old") query = query.eq("is_new", false);

  return query.range(from, from + SIZE - 1);
}

const cache = {
  get: (k: string) => { try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch { return null; } },
  set: (k: string, v: unknown) => sessionStorage.setItem(k, JSON.stringify(v))
};

export default function ProductsPage() {
  const { push } = useRouter();
  const [state, setState] = useState({
    prods: [] as ProductRecord[],
    cats: [] as CategoryOption[],
    total: 0,
    page: 0,
    more: true,
    loading: true,
    error: null as string | null,
    s: cache.get("ps") || "",
    c: cache.get("pc") || "",
    st: cache.get("pst") || "",
    isNew: cache.get("pn") || "" // Yeni ürün filtresi
  });

  const update = useCallback((updates: Partial<typeof state>) => {
    startTransition(() => {
      setState(prev => ({ ...prev, ...updates }));
    });
  }, []);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("id,name").order("name");
    update({ cats: data || [] });
  }, [update]);

  const fetchProducts = useCallback(async (pageNum: number, reset = false) => {
    const from = reset ? 0 : pageNum * SIZE;
    update({ loading: true, error: null, ...(reset ? { prods: [], page: 0 } : {}) });
    const { data, count, error } = await queryProducts({
      s: state.s,
      c: state.c,
      st: state.st,
      isNew: state.isNew
    }, from);

    setState(prev => ({
      ...prev,
      error: error?.message ?? null,
      prods: reset ? (data || []) : [...prev.prods, ...(data || [])],
      total: count || 0,
      more: from + SIZE < (count || 0),
      loading: false,
      ...(reset ? { page: 0 } : { page: pageNum })
    }));
  }, [state.s, state.c, state.st, state.isNew, update]);

  const deleteProduct = async (product: ProductRecord) => {
    if (!confirm(`${product.title} silinsin mi?`)) return;
    try {
      const [codesResult, vehiclesResult] = await Promise.all([
        supabase.from("product_codes").delete().eq("product_id", product.id),
        supabase.from("product_vehicles").delete().eq("product_id", product.id)
      ]);
      if (codesResult.error) throw codesResult.error;
      if (vehiclesResult.error) throw vehiclesResult.error;

      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;

      const { error: imageError } = await supabase.storage
        .from("product-images")
        .remove([`${product.sku}.jpg`]);
      if (imageError) {
        console.error("Ürün silindi ancak görsel silinemedi:", imageError);
        alert("Ürün silindi ancak görsel dosyası silinemedi.");
      }

      await fetchProducts(0, true);
    } catch (error) {
      console.error("Ürün silme hatası:", error);
      alert(error instanceof Error ? error.message : "Ürün silinemedi.");
    }
  };

  const navigate = (path: string) => {
    cache.set("scroll", window.scrollY);
    push(path);
  };

  const clearFilters = () => {
    ["ps", "pc", "pst", "pn"].forEach(k => cache.set(k, ""));
    update({ s: "", c: "", st: "", isNew: "", prods: [], page: 0 });
  };

  useEffect(() => { void loadCategories(); }, [loadCategories]);
  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const { data, count, error } = await queryProducts({
          s: state.s,
          c: state.c,
          st: state.st,
          isNew: state.isNew
        }, 0);
        if (!active) return;

        setState(prev => ({
          ...prev,
          prods: data || [],
          total: count || 0,
          more: SIZE < (count || 0),
          loading: false,
          error: error?.message ?? null,
          page: 0
        }));
      } catch (error) {
        if (!active) return;
        console.error("Ürün listesi yükleme hatası:", error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Ürünler yüklenemedi."
        }));
      }
    };

    void loadProducts();
    return () => {
      active = false;
    };
  }, [state.s, state.c, state.st, state.isNew]);
  useEffect(() => { 
    ["ps", "pc", "pst", "pn"].forEach((k, i) => cache.set(k, [state.s, state.c, state.st, state.isNew][i])); 
  }, [state.s, state.c, state.st, state.isNew]);

  const loadMore = () => {
    const nextPage = state.page + 1;
    update({ page: nextPage });
    fetchProducts(nextPage);
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200">📦</span>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Ürünler</h1>
              <p className="text-sm text-slate-500 font-medium">{state.total} ürün</p>
            </div>
          </div>
          <button onClick={() => navigate("/admin/products/new")} className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 text-sm">
            <span className="text-lg">+</span> Yeni Ürün
          </button>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <input placeholder="🔍 Ara..." value={state.s} onChange={e => update({ s: e.target.value, loading: true, error: null })} className={inputClass} />
          <select value={state.c} onChange={e => update({ c: e.target.value, loading: true, error: null })} className={inputClass}>
            <option value="">📁 Tüm Kategoriler</option>
            {state.cats.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select value={state.st} onChange={e => update({ st: e.target.value, loading: true, error: null })} className={inputClass}>
            <option value="">📊 Tümü</option>
            <option value="active">🟢 Aktif</option>
            <option value="passive">🔴 Pasif</option>
          </select>
          <select value={state.isNew} onChange={e => update({ isNew: e.target.value, loading: true, error: null })} className={inputClass}>
            <option value="">🆕 Tüm Ürünler</option>
            <option value="new">✨ Yeni Ürünler</option>
            <option value="old">📦 Normal Ürünler</option>
          </select>
        </div>

        {state.error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Ürünler yüklenemedi: {state.error}
          </div>
        )}

        {/* Yükleniyor */}
        {state.loading && !state.prods.length && (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-slate-400 font-bold">Yükleniyor...</p>
          </div>
        )}

        {/* Boş Durum */}
        {!state.loading && !state.prods.length && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <span className="text-6xl block mb-4">📭</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ürün Yok</h3>
            <p className="text-slate-500 mb-6">{state.s || state.c || state.st || state.isNew ? "Filtrelere uygun ürün bulunamadı" : "Henüz ürün eklenmemiş"}</p>
            <button onClick={() => state.s || state.c || state.st || state.isNew ? clearFilters() : navigate("/admin/products/new")} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
              {state.s || state.c || state.st || state.isNew ? "Filtreleri Temizle" : "İlk Ürünü Ekle"}
            </button>
          </div>
        )}

        {/* Tablo */}
        {!!state.prods.length && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["Ürün", "SKU", "Kategori", "Marka", "Pin", "Durum", "Yeni", ""].map((h, i) => (
                      <th key={i} className={`px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider ${i >= 4 ? "text-center" : i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.prods.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/admin/products/new?id=${p.id}`)} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                            <Image src={`${BUCKET}/${p.sku}.jpg`} className="w-full h-full object-cover" alt={p.title} width={48} height={48} unoptimized onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-700 truncate max-w-[250px]">{p.title}</div>
                            {p.product_codes?.slice(0, 2).map((c: ProductCode) => (
                              <span key={c.id} className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded mr-1">{c.code_type}: {c.code_value}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4"><span className="text-sm font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">{p.sku}</span></td>
                      <td className="px-3 py-4 text-sm text-slate-600">{p.categories?.name || "-"}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.product_vehicles?.slice(0, 2).map((v: ProductVehicle) => (
                            <span key={v.id} className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-lg">{v.brands?.name}</span>
                          )) || <span className="text-slate-300">-</span>}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-sm font-bold">{p.pin_count || 0}</td>
                      <td className="px-3 py-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {p.is_active ? "🟢 Aktif" : "🔴 Pasif"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        {p.is_new && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                            ✨ Yeni
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => navigate(`/admin/products/new?id=${p.id}`)} className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600">✏️</button>
                          <button onClick={() => deleteProduct(p)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {state.more && (
              <div className="text-center mt-8">
                <button onClick={loadMore} className="px-8 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 font-bold text-slate-600 hover:text-indigo-700 transition-all">
                  Daha Fazla ({state.total - state.prods.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}