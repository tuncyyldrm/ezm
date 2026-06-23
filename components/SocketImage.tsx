'use client';

import { useState, useEffect } from 'react';

interface SocketImageProps {
  src: string;
  alt: string;
  socketCode: string;
}

export default function SocketImage({ src, alt, socketCode }: SocketImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [liveSrc, setLiveSrc] = useState('');

  useEffect(() => {
    if (!src) { 
      setHasImage(false); 
      return; 
    }
    
    setImgError(false);
    
    // ⚡ Sayfa yenilemelerinde tarayıcının önbelleği (cache) temizlemesi için zaman damgası üretiyoruz
    const freshSrc = `${src}?t=${Date.now()}`;
    setLiveSrc(freshSrc);

    const img = new Image();
    img.onload = () => setHasImage(true);
    img.onerror = () => { 
      setHasImage(false); 
      setImgError(true); 
    };
    img.src = freshSrc; // Kontrolü taze URL ile yapıyoruz
  }, [src]);

  if (!socketCode) return null;

  return (
    // m-1 ekleyerek yan yana geldiklerinde birbirlerine yapışmasını engelledik
    <div 
      className="relative inline-block w-fit m-1"
      onMouseEnter={() => hasImage && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`px-4 py-2 rounded-lg font-mono font-bold border transition-colors select-none ${
        hasImage ? 'cursor-help text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' : 'cursor-default text-gray-500 bg-gray-50 border-gray-200'
      }`}>
        {socketCode}
      </div>

      {hasImage && isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[999] w-48 bg-white p-2 rounded-xl shadow-2xl border border-gray-100 pointer-events-none">
          <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
            <img 
              src={liveSrc} // ⚡ Buraya da taze cache-buster'lı linki veriyoruz
              alt={alt} 
              className="max-w-full max-h-full object-contain p-1"
              onError={() => setImgError(true)}
            />
          </div>
          <div className="text-center text-[9px] font-bold text-gray-400 mt-1.5 uppercase">Bağlı Ürün</div>
          {/* Ok işaretini ortalamak için left-1/2 ve -translate-x-1/2 eklendi */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-100" />
        </div>
      )}
    </div>
  );
}