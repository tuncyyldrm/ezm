'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';

interface ProductCardProps {
  product: any;
}

const STORAGE = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';

export default function ProductCard({ product }: ProductCardProps) {
  const codes = product?.product_codes || [];
  const oems = codes.filter((c: any) => c?.code_type === 'OEM').map((c: any) => c.code_value);
  const sockets = codes.filter((c: any) => c?.code_type === 'MUADIL').map((c: any) => c.code_value);
  const pin = product?.pin_count || 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group">
      {/* Ürün Görseli */}
      <Link href={`/product/${encodeURIComponent(product.sku)}`} className="block">
        <div className="relative h-40 flex items-center justify-center bg-white-50 rounded-xl mb-3 overflow-hidden group-hover:scale-[1.02] transition-transform">
          <ProductImage sku={product.sku} title={product.title} storageUrl={STORAGE} />
          {pin > 0 && (
            <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pin} PIN
            </span>
          )}
        </div>
      </Link>

      {/* Ürün Bilgisi */}
      <Link href={`/product/${encodeURIComponent(product.sku)}`} className="block mb-3">
        <h3 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
          {product.sku}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1" title={product.title}>
          {product.title}
        </p>
      </Link>

      {/* Kodlar */}
      <div className="border-t border-gray-50 pt-2 space-y-2">
        {oems.length > 0 && (
          <div className="text-[11px] text-gray-400 font-mono truncate" title={oems.join(', ')}>
            <span className="font-semibold text-gray-500">OEM:</span>{' '}
            {oems.slice(0, 2).join(', ')}
            {oems.length > 2 && <span className="text-blue-500 ml-1">+{oems.length - 2}</span>}
          </div>
        )}

        {sockets.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1.5">
              {sockets.slice(0, 4).map((code: string, i: number) => (
                <SocketChip key={i} code={code} />
              ))}
              {sockets.length > 4 && (
                <span className="text-[10px] text-gray-400 self-center">+{sockets.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {!oems.length && !sockets.length && (
          <div className="text-[11px] text-gray-300 italic">Kod yok</div>
        )}
      </div>
    </div>
  );
}

// Basit Socket Chip - Hover'da resim gösterir
function SocketChip({ code }: { code: string }) {
  const [show, setShow] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-200">
        {code}
      </span>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-100 cursor-help hover:bg-blue-100 transition-colors">
        {code}
      </span>

      {show && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-36 bg-white p-2 rounded-xl shadow-xl border border-gray-100">
          <div className="w-full h-26 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={`${STORAGE}/${code}.jpg`}
              alt={code}
              className="max-w-full max-h-full object-contain"
              onError={() => setImgError(true)}
            />
          </div>
          <div className="text-center text-[9px] font-bold text-gray-400 mt-1">{code}</div>
        </div>
      )}
    </div>
  );
}