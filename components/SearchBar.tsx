'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Product } from '@/lib/supabase';
import ProductImage from '@/components/ProductImage';

function createTurkishRegexPattern(text: string): string {
  return text
    .replace(/[+()]/g, '') // Tireyi (-) buradan sildik, koruyoruz.
    .replace(/[iİıI]/g, '[iİıI]')
    .replace(/[şŞsS]/g, '[şŞsS]')
    .replace(/[çÇcC]/g, '[çÇcC]')
    .replace(/[ğĞgG]/g, '[ğĞgG]')
    .replace(/[üÜuU]/g, '[üÜuU]')
    .replace(/[öÖoO]/g, '[öÖoO]');
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null); // 💡 Klavye navigasyonunda otomatik kaydırma için
  const router = useRouter();

  const PROJECT_ID = 'erntysmhwfxkrtegirds';
  const storageUrl = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/product-images`;

  // Dışarı tıklayınca kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Klavye ile aşağı yukarı inildiğinde scroll'u takip etmesi için
  useEffect(() => {
    if (selectedIndex === -1 || !resultsContainerRef.current) return;
    const container = resultsContainerRef.current;
    const selectedElement = container.children[selectedIndex + 1] as HTMLElement;
    
    if (selectedElement) {
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elemTop = selectedElement.offsetTop;
      const elemBottom = elemTop + selectedElement.clientHeight;

      if (elemTop < containerTop) {
        container.scrollTop = elemTop;
      } else if (elemBottom > containerBottom) {
        container.scrollTop = elemBottom - container.clientHeight;
      }
    }
  }, [selectedIndex]);

  // Debounce ile sunucu tarafında arama
  useEffect(() => {
    let active = true;

    const delayDebounceFn = setTimeout(async () => {
      const trimmed = query.trim();
      
      if (trimmed.length < 2) {
        setResults([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }

      setLoading(true);
      setSelectedIndex(-1);
      
      try {
        const keywords = trimmed.split(/\s+/);
        
        // Sizin yazdığınız, tire esnekliği sağlayan regex mantığı (Tamamen korundu)
        const flexiblePattern = createTurkishRegexPattern(trimmed).replace(/-/g, '-?');

        // Paralel sorgular
        const [titleRes, codeRes, brandRes] = await Promise.all([
          // 1. Başlık ve SKU'da Regex arama
          (async () => {
            let queryBuilder = supabase
              .from('products')
              .select('id, sku, title, pin_count')
              .eq('is_active', true);
            
            keywords.forEach(word => {
              const pattern = createTurkishRegexPattern(word);
              queryBuilder = queryBuilder.or(`title.imatch..*${pattern}.*,sku.imatch..*${pattern}.*`);
            });
            
            return queryBuilder.limit(8);
          })(),
          
          // 2. Ürün Kodlarında Esnek Regex Arama
          // 💡 GÜNCELLEME: inner join tablosunda 'is_active' kontrolü eklendi, pasif ürünler elendi
          (async () => {
            return supabase
              .from('product_codes')
              .select('products!inner(id, sku, title, pin_count, is_active)')
              .eq('products.is_active', true)
              .filter('code_value', 'imatch', `.*${flexiblePattern}.*`)
              .limit(8);
          })(),
          
          // 3. Marka adında Regex arama
          // 💡 GÜNCELLEME: inner join tablosunda 'is_active' kontrolü eklendi, pasif ürünler elendi
          (async () => {
            const brandPattern = createTurkishRegexPattern(trimmed);
            return supabase
              .from('product_vehicles')
              .select('products!inner(id, sku, title, pin_count, is_active)')
              .eq('products.is_active', true)
              .filter('brands.name', 'imatch', `.*${brandPattern}.*`)
              .limit(3);
          })()
        ]);

        if (!active) return;

        const titleData = (titleRes.data || []) as Product[];
        
        const codeData = (codeRes.data || [])
          .map((item: any) => item.products)
          .filter(Boolean) as Product[];
        
        const brandData = (brandRes.data || [])
          .map((item: any) => item.products)
          .filter(Boolean) as Product[];

        // Birleştir ve güvenli tekilleştir
        const combined = [...titleData, ...codeData, ...brandData];
        const unique = Array.from(
          new Map(combined.map(item => [item.id, item])).values()
        ).slice(0, 8);

        setResults(unique);
        setIsOpen(unique.length > 0);
      } catch (err) {
        console.error('Arama hatası:', err);
        if (active) setResults([]);
      } finally { // 💡 TypeScript hatası veren 'finaly' yazımı düzeltildi
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [query]);

  // Ürüne tıkla
  const handleProductClick = useCallback((sku: string) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    router.push(`/product/${encodeURIComponent(sku)}`);
  }, [router]);

  // Input değişince
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  // Temizle
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Klavye navigasyonu
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleProductClick(results[selectedIndex].sku);
        } else if (results.length > 0) {
          handleProductClick(results[0].sku);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, handleProductClick]);

  return (
    <div ref={searchRef} className="relative w-full max-w-xl mx-auto my-6 px-4">
      <div className="relative flex items-center">
        <svg className="absolute left-5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Parça adı, SKU, OEM veya Üretici kodu ile ara..."
          className="w-full px-6 py-4 pl-12 pr-12 text-sm bg-white border-2 border-gray-200 rounded-full shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
          autoComplete="off"
          aria-label="Ürün ara"
        />

        {loading && (
          <div className="absolute right-12">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {query && !loading && (
          <button onClick={handleClear} className="absolute right-4 p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="Aramayı temizle">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {isOpen && (
        <div 
          ref={resultsContainerRef} 
          className="absolute left-4 right-4 z-[100] mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-[400px] overflow-y-auto scroll-smooth"
        >
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{results.length} sonuç bulundu</p>
          </div>

          {results.map((product, index) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.sku)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center gap-4 p-3 cursor-pointer border-b border-gray-50 transition-all ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                <ProductImage sku={product.sku} title={product.title} storageUrl={storageUrl} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-blue-900 truncate">{product.sku}</p>
                  {product.pin_count > 0 && (
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">{product.pin_count} PIN</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">{product.title}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}