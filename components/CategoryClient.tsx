'use client';

import { useState, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';

interface CategoryClientProps {
  categoryName: string;
  products: any[];
}

export default function CategoryClient({ categoryName, products }: CategoryClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. PERFORMANS OPTİMİZASYONU: Ürünlerin arama indekslerini önceden hazırlıyoruz.
  // Bu sayede kullanıcı her harf yazdığında ağır döngüler (flatMap, map, join) tekrar çalışmaz.
  const indexedProducts = useMemo(() => {
    return products.map(product => {
      // Temizlenmiş SKU ve OEM kodları
      const cleanSku = product.sku ? product.sku.replace(/[\s\-_./]/g, '').toLocaleLowerCase('tr-TR') : '';
      const rawSku = product.sku ? product.sku.toLocaleLowerCase('tr-TR') : '';
      const title = product.title ? product.title.toLocaleLowerCase('tr-TR') : '';
      
      const codes: string[] = [];
      const cleanCodes: string[] = [];
      product.product_codes?.forEach((c: any) => {
        if (c.code_value) {
          const val = c.code_value.toLocaleLowerCase('tr-TR');
          codes.push(val);
          cleanCodes.push(val.replace(/[\s\-_./]/g, ''));
        }
      });

      const vehicles = product.product_vehicles?.map((pv: any) => pv.brands?.name?.toLocaleLowerCase('tr-TR')).filter(Boolean) || [];

      return {
        origin: product,
        // Öncelik sıralaması yapabilmek için alanları ayrı tutuyoruz
        sku: rawSku,
        cleanSku,
        title,
        codes,
        cleanCodes,
        vehicles,
        // Genel arama havuzu (içerir kontrolü için)
        fullPool: [rawSku, cleanSku, title, ...codes, ...cleanCodes, ...vehicles].join(' ')
      };
    });
  }, [products]);

  // 2. GELİŞMİŞ B2B ARAMA VE PUANLAMA ALGORİTMASI
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const cleanSearch = searchTerm.toLocaleLowerCase('tr-TR').trim();
    const searchWords = cleanSearch.split(/\s+/);
    const compactSearch = cleanSearch.replace(/[\s\-_./]/g, '');

    // Eşleşenleri bul ve puanla
    const scored = indexedProducts
      .map(item => {
        let score = 0;
        let isMatch = false;

        // B2B ÖNCELİK 1: Arama terimi SKU veya OEM kodu ile birebir başlıyor mu? (En yüksek öncelik)
        if (item.cleanSku.startsWith(compactSearch) || item.sku.startsWith(cleanSearch)) {
          score += 100;
          isMatch = true;
        }
        
        const codeStartsWith = item.cleanCodes.some(c => c.startsWith(compactSearch)) || item.codes.some(c => c.startsWith(cleanSearch));
        if (codeStartsWith) {
          score += 80;
          isMatch = true;
        }

        // B2B ÖNCELİK 2: Parça adı (Title) aranan kelimeyle mi başlıyor?
        if (item.title.startsWith(cleanSearch)) {
          score += 50;
          isMatch = true;
        }

        // B2B ÖNCELİK 3: Çoklu kelime aramalarında tüm kelimeler havuzda var mı? (Geriye dönük uyumluluk)
        const hasAllWords = searchWords.every(word => {
          const compactWord = word.replace(/[\s\-_./]/g, '');
          return item.fullPool.includes(word) || item.fullPool.includes(compactWord);
        });

        if (hasAllWords) {
          score += 10; // Havuzda var ama en başta değilse düşük puan
          isMatch = true;
        }

        return { product: item.origin, score, isMatch };
      })
      .filter(item => item.isMatch)
      // Puanı yüksek olanı (yani aranan kelimeyle başlayanı) en üste sırala
      .sort((a, b) => b.score - a.score);

    return scored.map(s => s.product);
  }, [searchTerm, indexedProducts, products]);

  const isEmpty = filteredProducts.length === 0;

  return (
    <div className="w-full space-y-6 min-h-[calc(100vh-250px)] flex flex-col">
      <div className="w-full bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Üretici kodu, OEM no veya parça adını yazın (örn: 1K0...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-16 py-4 rounded-xl text-sm font-medium outline-none shadow-inner border border-transparent focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold px-2.5 py-1.5 rounded-lg">
                TEMİZLE
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase">{categoryName}</h1>
          {searchTerm && <p className="text-xs text-gray-500 mt-0.5"><span className="font-semibold text-blue-600">"{searchTerm}"</span> için sonuçlar</p>}
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
              <div className="text-2xl mb-4">🔍</div>
              <h3 className="text-base font-bold text-gray-800 mb-2">Eşleşen Parça Bulunamadı</h3>
              <p className="text-sm text-gray-500 mb-6">Farklı anahtar kelimelerle tekrar deneyin.</p>
              <button onClick={() => setSearchTerm('')} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Aramayı Temizle
              </button>
            </div>
          </div>
        )}
        {filteredProducts.length > 0 && filteredProducts.length < 4 && (
          <div className="mt-6 min-h-[200px] flex items-center justify-center text-gray-400 text-sm">
            Bu kategorideki tüm ürünler görüntüleniyor
          </div>
        )}
      </div>
    </div>
  );
}