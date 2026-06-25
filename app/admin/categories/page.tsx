// app/admin/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET_URL = "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };

  const getImageUrl = (slug: string) => `${BUCKET_URL}/${slug}.jpg`;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const slug = name
      .toLowerCase()
      .replace(/[ğüşıöç]/g, (c: string) => ({ğ:'g',ü:'u',ş:'s',ı:'i',ö:'o',ç:'c'}[c] || c))
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      await supabase.storage.from("product-images").upload(`${slug}.${ext}`, imageFile, { upsert: true });
    }

    const categoryData = { name: name.trim(), slug, parent_id: parentId || null };

    const { error } = editId
      ? await supabase.from("categories").update(categoryData).eq("id", editId)
      : await supabase.from("categories").insert(categoryData);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      handleCancel();
      load();
    }
    setLoading(false);
  };

  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setName(cat.name);
    setParentId(cat.parent_id || "");
    setImageFile(null);
    setPreviewUrl(getImageUrl(cat.slug));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditId(null);
    setName("");
    setParentId("");
    setImageFile(null);
    setPreviewUrl("");
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`${cat.name} silinsin mi?`)) return;
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of extensions) {
      await supabase.storage.from("product-images").remove([`${cat.slug}.${ext}`]);
    }
    await supabase.from("categories").delete().eq("id", cat.id);
    load();
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const mainCategories = categories.filter(c => !c.parent_id);

  // Stil Değişkenleri (Temiz kod için ortaklaştırıldı)
  const inputStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium shadow-sm text-sm";
  const labelStyle = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Üst Başlık Alanı */}
      <div className="flex items-center justify-between py-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kategori Yönetimi</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Parça katalog ağacını ve hiyerarşisini düzenleyin</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-100 flex items-center">{mainCategories.length} Ana</span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs border border-slate-200 flex items-center">{categories.length - mainCategories.length} Alt</span>
        </div>
      </div>

      {/* Ana Grid Düzeni */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* SOL TARAF: ARAMA VE LİSTE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Kategori ağacında ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputStyle} pl-10 py-3.5`}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium text-sm">Kategori bulunamadı.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(cat => {
                  const parentCat = categories.find(c => c.id === cat.parent_id);
                  return (
                    <div key={cat.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-center gap-4">
                        {/* Liste İçi Görsel */}
                        <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {cat.slug ? (
                            <img 
                              src={getImageUrl(cat.slug)} 
                              alt={cat.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const el = (e.target as HTMLImageElement).parentElement;
                                if (el) el.innerHTML = `<span class="text-lg">${cat.parent_id ? "📂" : "📁"}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-lg">{cat.parent_id ? "📂" : "📁"}</span>
                          )}
                        </div>
                        
                        <div>
                          <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                            {cat.name}
                            {parentCat && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                {parentCat.name} Altı
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5">/{cat.slug}</div>
                        </div>
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">✏️</button>
                        <button onClick={() => handleDelete(cat)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ TARAF: YAPIŞKAN FORM (STICKY) */}
        <div className="lg:sticky lg:top-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                {editId ? "✏️ Kategoriyi Düzenle" : "➕ Yeni Kategori Ekle"}
              </h2>
              {editId && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Düzenleme Modu</span>}
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Kategori Adı</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Aydınlatma Grubu" className={inputStyle} required />
              </div>

              <div>
                <label className={labelStyle}>Üst Hiyerarşi</label>
                <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputStyle}>
                  <option value="">Ana Kategori (En Üst Seviye)</option>
                  {mainCategories.filter(c => c.id !== editId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Modern Dropzone Görsel Alanı */}
              <div>
                <label className={labelStyle}>Kategori Görseli</label>
                <div className="relative group bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-all">
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Önizleme" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg...' }} />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-3xl block mb-2">📸</span>
                      <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Görsel Seç / Sürükle</span>
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium">{editId ? "Değiştirmek için tıklayın" : "Opsiyonel"}</span>
                    </div>
                  )}
                  <input id="fileInput" type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Buton Aksiyonları */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-100 text-sm">
                {loading ? "Kaydediliyor..." : editId ? "Değişiklikleri Kaydet" : "Kategoriyi Oluştur"}
              </button>
              {editId && (
                <button type="button" onClick={handleCancel} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm">
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}