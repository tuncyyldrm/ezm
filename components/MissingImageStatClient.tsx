'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 1000;

export default function MissingImageStatClient() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeSkus = new Set<string>();
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error: dbErr } = await supabase
          .from('products')
          .select('sku')
          .eq('is_active', true)
          .range(offset, offset + PAGE_SIZE - 1);

        if (dbErr) throw dbErr;
        for (const product of data ?? []) {
          if (product.sku) activeSkus.add(product.sku.trim().toLocaleLowerCase('en-US'));
        }
        if (!data || data.length < PAGE_SIZE) break;
      }

      const storedImageNames = new Set<string>();
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error: stErr } = await supabase.storage
          .from('product-images')
          .list('', { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });

        if (stErr) throw stErr;
        for (const file of data ?? []) {
          if (file.id && file.name) storedImageNames.add(file.name.toLocaleLowerCase('en-US'));
        }
        if (!data || data.length < PAGE_SIZE) break;
      }

      const missing = [...activeSkus].filter(sku => !storedImageNames.has(`${sku}.jpg`)).length;
      setCount(missing);
    } catch (err) {
      console.error('Storage kontrol hatası:', err);
      setError('Storage dosya listeleme iznini kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border border-slate-100 ${
      error ? 'text-amber-600 bg-amber-50' : count !== null ? (count ? 'text-blue-600 bg-blue-50' : 'text-emerald-700 bg-emerald-50') : 'text-slate-500 bg-slate-50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">🖼️</div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={loading}
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-2xl"
        >
          {loading ? 'Taranıyor...' : count !== null ? 'Yeniden Tara' : 'Görselleri Kontrol Et'}
        </button>
      </div>
      <div className="text-2xl font-black text-slate-900">
        {loading ? '...' : count !== null ? count.toLocaleString('tr-TR') : '—'}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider mt-1">
        Stok Koduna Göre Görseli Eksik Aktif Ürün
      </p>
      {error && <p role="status" className="mt-2 text-xs font-medium text-amber-700">{error}</p>}
      {count === null && !loading && (
        <p className="mt-1 text-[11px] text-slate-400 font-medium">Kotayı korumak için kontrol isteğe bağlı çalışır.</p>
      )}
    </div>
  );
}
