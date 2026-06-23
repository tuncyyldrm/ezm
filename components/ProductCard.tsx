'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/supabase';
import ProductImage from '@/components/ProductImage';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const codesArray = product?.product_codes || [];
  const oemCodes = codesArray
    .filter((c: any) => c?.code_type === 'OEM' && c?.code_value)
    .map((c: any) => c.code_value);
  
  const socketCodes = codesArray.filter((c: any) => c?.code_type === 'MUADIL' && c?.code_value);
  
  const storageUrl = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';

  return (
    <div className="relative flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all min-h-[340px] z-10 hover:z-50 group">
      
      {/* Üst Kısım: Ana Ürün Görsel Linki */}
      <Link href={`/product/${encodeURIComponent(product.sku)}`} className="block w-full">
        <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white rounded-lg mb-3 overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
          <ProductImage sku={product.sku} title={product.title} storageUrl={storageUrl} />
          {product.pin_count > 0 && (
            <span className="absolute top-2 right-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {product.pin_count} PIN
            </span>
          )}
        </div>
      </Link>

      <div className="flex-1 flex flex-col justify-end">
        <Link href={`/product/${encodeURIComponent(product.sku)}`} className="block">
          <h3 className="text-lg font-extrabold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{product.sku}</h3>
          <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-3 h-8" title={product.title}>{product.title}</p>
        </Link>

        <div className="border-t border-gray-100 pt-2 space-y-2">
          {oemCodes.length > 0 && (
            <div className="text-[11px] text-gray-400 font-mono truncate select-all" title={oemCodes.join(', ')}>
              <span className="font-semibold text-gray-500">OEM:</span> {oemCodes.slice(0, 3).join(', ')}
              {oemCodes.length > 3 && <span className="text-blue-500 ml-1">+{oemCodes.length - 3}</span>}
            </div>
          )}

          {/* 🔗 ÇOKLU BAĞLI ÜRÜN KODLARI */}
          {socketCodes.length > 0 && (
            <div className="space-y-1.5 relative z-20">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Bağlı Ürünler ({socketCodes.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {socketCodes.map((code: any, idx: number) => (
                  <SocketBadge key={`${code.code_value}-${idx}`} code={code.code_value} storageUrl={storageUrl} />
                ))}
              </div>
            </div>
          )}

          {oemCodes.length === 0 && socketCodes.length === 0 && (
            <div className="text-[11px] text-gray-300 italic">Referans kodu yok</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Her bir MUADIL kodu için ayrı hover'lu badge (Yenileme Hataları Düzeltildi)
function SocketBadge({ code, storageUrl }: { code: string; storageUrl: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [liveSrc, setLiveSrc] = useState('');

  useEffect(() => {
    // ⚡ Tarayıcının hatalı 404 önbelleğini ezmek için anlık zaman damgası basıyoruz
    const freshUrl = `${storageUrl}/${code}.jpg?t=${Date.now()}`;
    setLiveSrc(freshUrl);

    const img = new Image();
    img.onload = () => setHasImage(true);
    img.onerror = () => setHasImage(false);
    img.src = freshUrl; // Kontrolü taze URL ile tetikliyoruz usta
    
    return () => { 
      img.onload = null; 
      img.onerror = null; 
    };
  }, [code, storageUrl]);

  return (
    <div className="relative inline-block" onMouseEnter={() => hasImage && setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase select-none transition-all ${
        hasImage ? 'cursor-help text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100' : 'cursor-default text-gray-500 bg-gray-50 border-gray-200'
      }`}>
        {code}
      </div>

      {hasImage && isHovered && (
        <div className="absolute left-0 bottom-full mb-2 z-[999] w-40 bg-white p-2 rounded-xl shadow-2xl border border-gray-100 pointer-events-none">
          <div className="w-full h-28 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
            <img src={liveSrc} alt={code} className="max-w-full max-h-full object-contain p-1" loading="lazy" />
          </div>
          <div className="text-center text-[9px] font-bold text-gray-400 mt-1 uppercase">{code}</div>
          <div className="absolute top-full left-4 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-100" />
        </div>
      )}
    </div>
  );
}