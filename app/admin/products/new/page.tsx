// app/admin/products/new/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const BUCKET = "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images";
const slugify = (s: string) => s.toLowerCase().replace(/[ğüşıöç]/g, c => ({ğ:'g',ü:'u',ş:'s',ı:'i',ö:'o',ç:'c'}[c]||c)).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

function Form() {
  const { push } = useRouter();
  const id = useSearchParams().get("id");
  const edit = !!id;
  const [cats, setCats] = useState<any[]>([]);
  const [load, setLoad] = useState(false);
  const [img, setImg] = useState<File | null>(null);
  const [prev, setPrev] = useState("");
  const [bi, setBi] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [codes, setCodes] = useState([{ v: "", t: "OEM" }]);
  const [f, setF] = useState({ title: "", sku: "", cat: "", pin: 0, active: true, isNew: false });

  useEffect(() => { supabase.from("categories").select("*").order("name").then(({ data }) => setCats(data||[])); if(id) init(); }, []);

  const init = async () => {
    const { data: p } = await supabase.from("products").select("*, product_codes(*), product_vehicles(*, brands(*))").eq("id", id).single();
    if (!p) return;
    setF({ title: p.title, sku: p.sku, cat: p.category_id||"", pin: p.pin_count||0, active: p.is_active, isNew: p.is_new });
    setPrev(`${BUCKET}/${p.sku}.jpg`);
    if (p.product_codes?.length) setCodes(p.product_codes.map((c: any) => ({ v: c.code_value, t: c.code_type })));
    if (p.product_vehicles?.length) setBrands(p.product_vehicles.map((v: any) => v.brands?.name).filter(Boolean));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoad(true);
    try {
      if (img) await supabase.storage.from("product-images").upload(`${f.sku.trim()}.jpg`, img, { upsert: true });
      const { data: bIds } = await supabase.from("brands").upsert(brands.map(n => ({ name: n, slug: slugify(n) })), { onConflict: "name" }).select("id");
      const ids = bIds?.map(b => b.id) || [];
      const payload = { ...f, sku: f.sku.trim().toUpperCase(), category_id: f.cat ? +f.cat : null, pin_count: f.pin, is_new: f.isNew, is_active: f.active };
      let pid = id ? +id : 0;

      if (id) {
        await supabase.from("products").update(payload).eq("id", pid);
        await Promise.all([supabase.from("product_codes").delete().eq("product_id", pid), supabase.from("product_vehicles").delete().eq("product_id", pid)]);
      } else {
        const { data: np } = await supabase.from("products").insert(payload).select("id").single();
        pid = np?.id || 0;
      } 

      const vc = codes.filter(c => c.v.trim());
      if (vc.length) await supabase.from("product_codes").insert(vc.map(c => ({ product_id: pid, code_value: c.v.trim().toUpperCase(), code_type: c.t })));
      if (ids.length) await supabase.from("product_vehicles").insert(ids.map(bid => ({ product_id: pid, brand_id: bid })));
      push("/admin/products");
    } catch (e: any) { alert(e.message); setLoad(false); }
  };

  const I = "px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400";
  const L = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";
  const C = "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">{edit?"✏️":"➕"}</span>
            <div><h1 className="text-3xl font-black text-slate-900">{edit?"Düzenle":"Yeni Ürün"}</h1><p className="text-sm text-slate-500 font-medium">{edit?"Bilgileri güncelleyin":"Kataloğa ekleyin"}</p></div>
          </div>
          <button onClick={() => push("/admin/products")} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">← Liste</button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className={C}>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">📋 Temel Bilgiler</h2>
              <div><label className={L}>Başlık *</label><input style={{width: "calc(100% - 1rem)"}} value={f.title} onChange={e => setF({...f, title: e.target.value})} className={`${I} !py-4 !text-lg !font-semibold`} placeholder="Ürün adı" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={L}>SKU *</label><input value={f.sku} onChange={e => setF({...f, sku: e.target.value.toUpperCase()})} className={`${I} font-mono`} placeholder="EZM-001" required /></div>
                <div><label className={L}>Pin</label><input type="number" value={f.pin} onChange={e => setF({...f, pin: +e.target.value})} className={I} /></div>
              </div>
              <div><label className={L}>Kategori</label><select value={f.cat} onChange={e => setF({...f, cat: e.target.value})} className={I}><option value="">Seçin</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>

            <div className={C}>
              <div className="flex items-center justify-between"><h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">🏷️ Kodlar</h2><button type="button" onClick={() => setCodes([...codes, {v:"",t:"OEM"}])} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">+ Ekle</button></div>
              {codes.map((c,i) => (
                <div key={i} className="flex gap-2">
                  <input value={c.v} onChange={e => setCodes(codes.map((x,j) => j===i?{...x,v:e.target.value}:x))} placeholder="Kod" className={`${I} flex-1`} />
                  <select value={c.t} onChange={e => setCodes(codes.map((x,j) => j===i?{...x,t:e.target.value}:x))} className={`${I} w-32`}><option>OEM</option><option>MUADIL</option><option>URETICI</option></select>
                  <button type="button" onClick={() => setCodes(codes.filter((_,j) => j!==i))} className="px-3 text-slate-400 hover:text-red-500 font-bold">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className={C}>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">🖼️ Görsel</h2>
              <div className="relative aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-all group">
                {prev ? <img src={prev} className="w-full h-full object-contain p-4" alt="" /> : <div className="text-center"><span className="text-5xl">📸</span><p className="text-xs text-slate-400 font-bold mt-2">Görsel Seçin</p></div>}
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if(f){ setPrev(URL.createObjectURL(f)); setImg(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className={C}>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">🚗 Markalar</h2>
              <input value={bi} onChange={e => setBi(e.target.value)} onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); const v = bi.trim(); if(v && !brands.includes(v)){ setBrands([...brands, v]); setBi(""); } } }} placeholder="Marka yaz, Enter'a bas" className={I} />
              <div className="flex flex-wrap gap-2">{brands.map(b => <span key={b} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">{b}<button type="button" onClick={() => setBrands(brands.filter(x => x!==b))} className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-red-100 hover:text-red-500">×</button></span>)}</div>
            </div>

            <div className={C}>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">⚙️ Durum</h2>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-white transition-all"><span className="text-sm font-bold text-slate-600">Aktif</span><input type="checkbox" checked={f.active} onChange={e => setF({...f, active: e.target.checked})} className="w-5 h-5 rounded text-indigo-600" /></label>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-white transition-all"><span className="text-sm font-bold text-slate-600">Yeni Etiketi</span><input type="checkbox" checked={f.isNew} onChange={e => setF({...f, isNew: e.target.checked})} className="w-5 h-5 rounded text-emerald-600" /></label>
            </div>

            <button type="submit" disabled={load} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]">
              {load ? "⏳" : edit ? "💾 Kaydet" : "🚀 Yayınla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default () => <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-slate-400 font-bold animate-pulse">...</div></div>}><Form /></Suspense>;