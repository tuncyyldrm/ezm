'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Product } from '@/lib/supabase';
import ProductImage from '@/components/ProductImage';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Debounce ile sunucu tarafında arama
  useEffect(() => {
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
        const cleanQuery = trimmed.replace(/[- ]/g, '');

        // Paralel sorgular: Ürün başlık/SKU + OEM kodları + Marka adı
        const [titleRes, oemRes, brandRes] = await Promise.all([
          // 1. Başlık ve SKU'da her kelimeyi ara
          (async () => {
            let query = supabase
              .from('products')
              .select('id, sku, title, pin_count, product_codes(code_value)')
              .eq('is_active', true);
            
            keywords.forEach(word => {
              query = query.or(`title.ilike.%${word}%,sku.ilike.%${word}%`);
            });
            
            return query.limit(8);
          })(),
          
          // 2. OEM kodlarında ara (boşluksuz)
          supabase
            .from('product_codes')
            .select('products!inner(id, sku, title, pin_count)')
            .ilike('code_value', `%${cleanQuery}%`)
            .limit(5),
          
          // 3. Marka adında ara
          supabase
            .from('product_vehicles')
            .select('products!inner(id, sku, title, pin_count), brands!inner(name)')
            .ilike('brands.name', `%${trimmed}%`)
            .limit(3)
        ]);

        // Sonuçları birleştir
        const titleData = (titleRes.data || []) as Product[];
        
        const oemData = (oemRes.data || [])
          .map((item: any) => item.products)
          .filter(Boolean) as Product[];
        
        const brandData = (brandRes.data || [])
          .map((item: any) => item.products)
          .filter(Boolean) as Product[];

        // Birleştir ve ID'ye göre tekilleştir
        const combined = [...titleData, ...oemData, ...brandData];
        const unique = Array.from(
          new Map(combined.map(item => [item.id, item])).values()
        ).slice(0, 8);

        setResults(unique);
        setIsOpen(unique.length > 0);
      } catch (err) {
        console.error('Arama hatası:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce - hızlı ama sunucuyu yormaz

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Input değişince
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  // Ürüne tıkla
  const handleProductClick = useCallback((sku: string) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    router.push(`/product/${sku}`);
  }, [router]);

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
        setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
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
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, handleProductClick]);

  return (
    <div ref={searchRef} className="relative w-full max-w-xl mx-auto my-6 px-4">
      <div className="relative flex items-center">
        {/* Arama İkonu */}
        <svg 
          className="absolute left-5 w-5 h-5 text-gray-400 pointer-events-none" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2.5" 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Parça adı, SKU, OEM kodu veya marka ile ara..."
          className="w-full px-6 py-4 pl-12 pr-12 text-sm bg-white border-2 border-gray-200 rounded-full shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
          autoComplete="off"
          aria-label="Ürün ara"
          aria-expanded={isOpen}
          role="combobox"
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-12">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Temizleme Butonu */}
        {query && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Aramayı temizle"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Sonuç Dropdown'ı */}
      {isOpen && (
        <div 
          className="absolute left-4 right-4 z-[100] mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-[400px] overflow-y-auto"
          role="listbox"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-400">Aranıyor...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Sonuç sayısı */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {results.length} sonuç bulundu
                </p>
              </div>

              {results.map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.sku)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-4 p-3 cursor-pointer border-b border-gray-50 transition-all ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                    <ProductImage sku={product.sku} title={product.title} storageUrl={storageUrl} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-blue-900 truncate">{product.sku}</p>
                      {(product as any).pin_count > 0 && (
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                          {(product as any).pin_count} PIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{product.title}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm font-medium text-gray-700 mb-1">Sonuç Bulunamadı</p>
              <p className="text-xs text-gray-400">Farklı anahtar kelimelerle tekrar deneyin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}