'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import { compactSearchText, normalizeSearchText } from '@/lib/search';
import { trackCustomEvent } from '@/components/CoreStatusMonitor';

type ProductCode = {
  code_value?: string | null;
};

type ProductVehicle = {
  brands?:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
};

type ProductRecord = {
  id?: number | string;
  sku: string;
  title: string;
  product_codes?: ProductCode[] | null;
  product_vehicles?: ProductVehicle[] | null;
};

interface CategoryClientProps {
  categoryName: string;
  products: ProductRecord[];
}

export default function CategoryClient({ categoryName, products }: CategoryClientProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const lastTrackedSearch = useRef('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // 1. ARAMA HAVUZU INDEKSLENMESI
  const indexedProducts = useMemo(() => {
    return products.map(product => {
      const cleanSku = compactSearchText(product.sku);
      const rawSku = normalizeSearchText(product.sku);
      const title = normalizeSearchText(product.title);
      
      const codes: string[] = [];
      const cleanCodes: string[] = [];
      
      product.product_codes?.forEach((c: ProductCode) => {
        if (c.code_value) {
          const val = normalizeSearchText(c.code_value);
          codes.push(val);
          cleanCodes.push(compactSearchText(val));
        }
      });

      const vehicles = (product.product_vehicles || []).flatMap((pv: ProductVehicle) => {
        if (!pv.brands) return [];
        if (Array.isArray(pv.brands)) return pv.brands.map((brand) => brand?.name ? normalizeSearchText(brand.name) : undefined).filter((name): name is string => Boolean(name));
        return pv.brands.name ? [normalizeSearchText(pv.brands.name)] : [];
      });

      return {
        origin: product,
        sku: rawSku,
        cleanSku,
        title,
        codes,
        cleanCodes,
        vehicles,
        // Güçlendirilmiş alt kelime havuzu
        fullPool: [rawSku, cleanSku, title, ...codes, ...cleanCodes, ...vehicles].join(' || ')
      };
    });
  }, [products]);

  // 2. AKILLI PUANLAMA VE SIRALAMA MOTORU
  const filteredProducts = useMemo(() => {
    if (!debouncedSearch.trim()) return products;

    const cleanSearch = normalizeSearchText(debouncedSearch).trim();
    const searchWords = cleanSearch.split(/\s+/);
    const compactSearch = compactSearchText(cleanSearch);

    const scored = indexedProducts
      .map(item => {
        let score = 0;
        let isMatch = false;

        // A. Tam SKU Eşleşme (En yüksek öncelik)
        if (item.cleanSku.startsWith(compactSearch) || item.sku.startsWith(cleanSearch)) {
          score += 100;
          isMatch = true;
        }
        
        // B. OEM / Muadil / Üretici Kodu Eşleşmesi
        const codeStartsWith = item.cleanCodes.some(c => c.startsWith(compactSearch)) || item.codes.some(c => c.startsWith(cleanSearch));
        if (codeStartsWith) {
          score += 80;
          isMatch = true;
        }

        // C. Başlık Kelimesi Önceliği
        if (item.title.startsWith(cleanSearch)) {
          score += 50;
          isMatch = true;
        }

        // D. 💡 ÇÖZÜM: Parçalı Havuz Araması (Çoklu kelimelerde esnek eşleşme sağlar)
        const hasAllWords = searchWords.every(word => {
          const compactWord = compactSearchText(word);
          return item.fullPool.includes(word) || item.fullPool.includes(compactWord);
        });

        if (hasAllWords) {
          score += 15;
          isMatch = true;
        }

        return { product: item.origin, score, isMatch };
      })
      .filter(item => item.isMatch)
      .sort((a, b) => b.score - a.score);

    return scored.map(s => s.product);
  }, [debouncedSearch, indexedProducts, products]);

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term.length < 2) {
      lastTrackedSearch.current = '';
      return;
    }
    if (term === lastTrackedSearch.current) return;
    lastTrackedSearch.current = term;
    trackCustomEvent('search', {
      term,
      result_count: filteredProducts.length,
    });
  }, [debouncedSearch, filteredProducts.length]);

  const isEmpty = filteredProducts.length === 0;

  const handleClear = () => {
    setInputValue('');
    setDebouncedSearch('');
  };

  return (
    <div className="w-full space-y-6 min-h-[calc(100vh-250px)] flex flex-col">
      <div className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-900 p-6 shadow-sm">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Üretici kodu, OEM no veya parça adını yazın"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="w-full rounded-xl border border-transparent py-4 pl-12 pr-16 text-sm font-medium outline-none shadow-inner transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 transition-colors hover:bg-gray-200"
              >
                TEMİZLE
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{categoryName}</h2>
          {debouncedSearch && (
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-semibold text-blue-600">“{debouncedSearch}”</span> için sonuçlar
            </p>
          )}
        </div>
        <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${!isEmpty ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-red-700 bg-red-50 border-red-100'}`}>
          {filteredProducts.length} Ürün
        </div>
      </div>

      <div className="flex-1">
        {!isEmpty ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px] h-full">
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 max-w-md w-full">
              <div className="text-2xl mb-4">⚙️</div>
              <h3 className="text-base font-bold text-gray-800 mb-2">Eşleşen Parça Bulunamadı</h3>
              <p className="text-sm text-gray-500 mb-6">Farklı anahtar kelimelerle veya parça numarasıyla tekrar deneyin.</p>
              <button onClick={handleClear} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Aramayı Temizle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}