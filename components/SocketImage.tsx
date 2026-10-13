'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SocketImageProps {
  src: string;
  alt: string;
  socketCode: string;
}

export default function SocketImage({ src, alt, socketCode }: SocketImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!socketCode) return null;

  return (
    <div 
      className="relative inline-block w-fit m-1"
      onMouseEnter={() => !imgError && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`px-4 py-2 rounded-lg font-mono font-bold border transition-colors select-none ${
        !imgError ? 'cursor-help text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' : 'cursor-default text-gray-500 bg-gray-50 border-gray-200'
      }`}>
        {socketCode}
      </div>

      {!imgError && isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[999] w-48 bg-white p-2 rounded-xl shadow-2xl border border-gray-100 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="relative w-full h-32 bg-white-50 rounded-lg overflow-hidden flex items-center justify-center">
            <Image 
              src={src} 
              alt={`${alt} - Muadil Soket`} 
              fill
              sizes="192px"
              className="object-contain p-2"
              onError={() => {
                setImgError(true);
                setIsHovered(false);
              }}
            />
          </div>
          <div className="text-center text-[9px] font-bold text-gray-400 mt-1.5 uppercase">Bağlı Ürün Bilgisi</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-100" />
        </div>
      )}
    </div>
  );
}