// app/admin/products/new/page.tsx
"use client";

import Image from "next/image";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { normalizeSearchText } from "@/lib/search";

export const dynamic = 'force-dynamic';

const BUCKET_URL = "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images";

type CategoryOption = {
  id: number;
  name: string;
};

type ProductCodeForm = {
  code_value: string;
  code_type: string;
};

// 🌟 1. ASIL FORM İÇERİĞİ VE MANTIK ALANI (useSearchParams burada güvenle çalışır)
function ProductFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [brandInput, setBrandInput] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [codes, setCodes] = useState([{ code_value: "", code_type: "OEM" }]);

  const [formData, setFormData] = useState({
    title: "",
    sku: "",
    category_id: "",
    pin_count: 0,
    is_new: false,
    is_active: true,
    sort_order: 0,
  });

  const loadProduct = useCallback(async () => {
    if (!editId) return;

    const { data: p, error } = await supabase.from("products").select("*, product_codes(*), product_vehicles(*, brands(*))").eq("id", editId).single();
    if (error) throw error;
    if (!p) throw new Error("Düzenlenecek ürün bulunamadı.");

    setFormData({
      title: p.title,
      sku: p.sku,
      category_id: p.category_id?.toString() || "",
      pin_count: p.pin_count || 0,
      is_new: p.is_new || false,
      is_active: p.is_active ?? true,
      sort_order: p.sort_order || 0,
    });
    setPreviewUrl(`${BUCKET_URL}/${p.sku}.jpg`);
    if (p.product_codes?.length) setCodes(p.product_codes.map((c: ProductCodeForm) => ({ code_value: c.code_value, code_type: c.code_type })));
    if (p.product_vehicles?.length) {
      const productBrandNames = p.product_vehicles
        .map((v: { brands?: { name?: string | null } | null }) => v.brands?.name)
        .filter((name: string | null | undefined): name is string => Boolean(name));
      setBrands(productBrandNames);
    }
  }, [editId]);

  useEffect(() => {
    let active = true;

    const loadFormData = async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      if (active) setCategories(data || []);
      await loadProduct();
    };

    void loadFormData().catch(error => {
      if (!active) return;
      console.error("Ürün formu yükleme hatası:", error);
      alert(error instanceof Error ? error.message : "Ürün formu yüklenemedi.");
    });

    return () => {
      active = false;
    };
  }, [loadProduct]);

  const updateForm = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => setFormData(prev => ({ ...prev, [key]: value }));

  const addBrand = () => {
    const name = brandInput.trim();
    if (!name) return;

    if (brands.some(brand => normalizeSearchText(brand) === normalizeSearchText(name))) {
      setBrandInput("");
      return;
    }

    setBrands(prev => [...prev, name]);
    setBrandInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedCategoryId = Number(formData.category_id);
      if (!formData.category_id || Number.isNaN(selectedCategoryId)) {
        alert("Kategori seçimi zorunludur.");
        setLoading(false);
        return;
      }

      if (imageFile) {
        const { error } = await supabase.storage.from("product-images").upload(
          `${formData.sku.trim()}.jpg`,
          imageFile,
          { upsert: true }
        );
        if (error) throw new Error(`Ürün görseli yüklenemedi: ${error.message}`);
      }

      const selectedBrands = [...brands];
      const pendingBrand = brandInput.trim();
      if (
        pendingBrand &&
        !selectedBrands.some(brand => normalizeSearchText(brand) === normalizeSearchText(pendingBrand))
      ) {
        selectedBrands.push(pendingBrand);
      }

      const brandObjects = selectedBrands.map(name => ({
        name,
        slug: name.toLowerCase().replace(/[ğüşıöç]/g, c => ({ ğ: 'g', ü: 'u', ş: 's', ı: 'i', ö: 'o', ç: 'c' }[c] || c)).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      }));

      let brandIds: number[] = [];
      if (brandObjects.length) {
        const { data: insertedBrands, error } = await supabase
          .from("brands")
          .upsert(brandObjects, { onConflict: "name" })
          .select("id");
        if (error) throw new Error(`Markalar kaydedilemedi: ${error.message}`);
        brandIds = insertedBrands?.map(b => b.id) || [];
      }

      const productPayload = { ...formData, sku: formData.sku.trim().toUpperCase(), category_id: selectedCategoryId };
      let productId = Number(editId);

      if (editId) {
        const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
        if (error) throw new Error(`Ürün güncellenemedi: ${error.message}`);
        const [codesDelete, vehiclesDelete] = await Promise.all([
          supabase.from("product_codes").delete().eq("product_id", productId),
          supabase.from("product_vehicles").delete().eq("product_id", productId)
        ]);
        if (codesDelete.error) throw new Error(`Ürün kodları güncellenemedi: ${codesDelete.error.message}`);
        if (vehiclesDelete.error) throw new Error(`Ürün marka ilişkileri güncellenemedi: ${vehiclesDelete.error.message}`);
      } else {
        const { data: newP, error } = await supabase
          .from("products")
          .insert(productPayload)
          .select("id")
          .single();

        if (error) throw new Error(`Ürün eklenemedi: ${error.message}`);
        if (!newP) throw new Error("Ürün verisi alınamadı.");

        productId = newP.id;
      }

      const validCodes = codes.filter(c => c.code_value.trim());
      if (validCodes.length) {
        const { error } = await supabase.from("product_codes").insert(validCodes.map(c => ({ product_id: productId, code_value: c.code_value.trim().toUpperCase(), code_type: c.code_type })));
        if (error) throw new Error(`Ürün kodları kaydedilemedi: ${error.message}`);
      }
      if (brandIds.length) {
        const { error } = await supabase.from("product_vehicles").insert(brandIds.map(bId => ({ product_id: productId, brand_id: bId })));
        if (error) throw new Error(`Ürün marka ilişkileri kaydedilemedi: ${error.message}`);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bir hata oluştu.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const sectionCard = "bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6";
  const labelStyle = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";
  const inputStyle = "px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium";

  return (
    <div className="bg-slate-50 min-height-screen pb-20">
      <div className="flex items-center justify-between py-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {editId ? "Ürünü Düzenle" : "Yeni Ürün Oluştur"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Katalog yönetimi ve envanter güncelleme</p>
        </div>
        <button onClick={() => router.push("/admin/products")} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 font-semibold rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2 text-sm">
          <span>←</span> Listeye Dön
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className={sectionCard}>
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
              <span className="text-xl">📋</span>
              <h2 className="font-bold text-slate-800 text-lg">Temel Detaylar</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Ürün Başlığı</label>
                <input type="text" value={formData.title} onChange={e => updateForm("title", e.target.value)} className={inputStyle} style={{ width: "100%" }} placeholder="Parça adı veya tanımı..." required />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelStyle}>Stok Kodu (SKU)</label>
                  <input type="text" value={formData.sku} onChange={e => updateForm("sku", e.target.value.toUpperCase())} className={`${inputStyle} font-mono`} placeholder="EZM-001" required />
                </div>
                <div>
                  <label className={labelStyle}>Pin Sayısı</label>
                  <input type="number" value={formData.pin_count} onChange={e => updateForm("pin_count", Number(e.target.value))} className={inputStyle} />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Kategori</label>
                <select value={formData.category_id} onChange={e => updateForm("category_id", e.target.value)} className={inputStyle} required>
                  <option value="">Seçim Yapın</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏷️</span>
                <h2 className="font-bold text-slate-800 text-lg">Referans Kodları</h2>
              </div>
              <button type="button" onClick={() => setCodes([...codes, { code_value: "", code_type: "OEM" }])} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">
                + YENİ KOD EKLE
              </button>
            </div>

            <div className="space-y-3">
              {codes.map((code, i) => (
                <div key={i} className="flex gap-3 group animate-in fade-in slide-in-from-top-1">
                  <input type="text" value={code.code_value} onChange={e => setCodes(codes.map((c, idx) => idx === i ? { ...c, code_value: e.target.value } : c))} placeholder="Kod değeri..." className={`${inputStyle} flex-1`} />
                  <select value={code.code_type} onChange={e => setCodes(codes.map((c, idx) => idx === i ? { ...c, code_type: e.target.value } : c))} className={`${inputStyle} w-40`}>
                    <option value="OEM">OEM</option>
                    <option value="MUADIL">Muadil</option>
                    <option value="URETICI">Üretici</option>
                  </select>
                  <button type="button" onClick={() => setCodes(codes.filter((_, idx) => idx !== i))} className="px-3 text-slate-300 hover:text-red-500 transition">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className={sectionCard}>
            <h2 className={labelStyle}>Görsel Yönetimi</h2>
            <div className="relative group">
              <div className="bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-300">
                {previewUrl ? (
                  <Image src={previewUrl} className="w-full h-full object-cover" alt="Önizleme" width={1200} height={800} unoptimized />
                ) : (
                  <div className="text-center p-6">
                    <span className="text-4xl block mb-2">📸</span>
                    <span className="text-xs font-bold text-slate-400">GÖRSEL YOK</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setPreviewUrl(URL.createObjectURL(file)); setImageFile(file); }
              }} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">Görseli değiştirmek için tıklayın</p>
          </div>

          <div className={sectionCard}>
            <h2 className={labelStyle}>Uyumlu Markalar</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={brandInput}
                onChange={e => setBrandInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBrand();
                  }
                }}
                placeholder="Marka..."
                className={inputStyle}
                aria-label="Uyumlu marka adı"
              />
              <button
                type="button"
                onClick={addBrand}
                disabled={!brandInput.trim()}
                className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map(brand => (
                <span key={brand} className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">
                  {brand}
                  <button type="button" onClick={() => setBrands(brands.filter(b => b !== brand))} className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-indigo-200/50 transition">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className={sectionCard}>
            <h2 className={labelStyle}>Durum Ayarları</h2>
            <div className="space-y-4 pt-2">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                <span className="text-sm font-bold text-slate-600">Aktif Satış</span>
                <input type="checkbox" checked={formData.is_active} onChange={e => updateForm("is_active", e.target.checked)} className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                <span className="text-sm font-bold text-slate-600">Yeni Ürün Etiketi</span>
                <input type="checkbox" checked={formData.is_new} onChange={e => updateForm("is_new", e.target.checked)} className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500" />
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]">
            {loading ? "İŞLENİYOR..." : editId ? "DEĞİŞİKLİKLERİ KAYDET" : "ÜRÜNÜ YAYINLA"}
          </button>
        </div>
      </form>
    </div>
  );
}

// 🌟 2. NEXT.JS'E EXPORT EDİLEN VE HATAYI BAĞLAYAN ANA SARMALAYICI (DEFAULT EXPORT)
export default function ProductFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-sm font-bold text-slate-400 animate-pulse tracking-wider uppercase">Sayfa Hazırlanıyor...</div>
      </div>
    }>
      <ProductFormContent />
    </Suspense>
  );
}