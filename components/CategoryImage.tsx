'use client';
import { useState, useEffect } from 'react';

// Sadece en yaygın iki varyasyonu arıyoruz (Hafif, hızlı ve önbellek korumalı)
const FORMATS = ['jpg', 'JPG'];
const FALLBACK_IMAGE = 'https://placehold.co/300x300?text=Resim+Yok';

export default function CategoryImage({ slug, name, storageUrl }: { slug: string; name: string; storageUrl: string }) {
  const [formatIndex, setFormatIndex] = useState(0);
  const [src, setSrc] = useState(`${storageUrl}/${slug}.${FORMATS[0]}`);

  useEffect(() => {
    setFormatIndex(0);
    // ⚡ İŞTE ÇÖZÜM BURASI: Arkasına eklediğimiz ?t=${Date.now()} sayesinde
    // sayfa yenilendiğinde tarayıcı eski "hatalı" hafızayı değil, direkt güncel resmi çeker.
    setSrc(`${storageUrl}/${slug}.${FORMATS[0]}?t=${Date.now()}`);
  }, [slug, storageUrl]);

  const handleError = () => {
    if (src === FALLBACK_IMAGE) return;

    const nextIndex = formatIndex + 1;
    
    if (nextIndex < FORMATS.length) {
      // .jpg bulamadıysa büyük harfli .JPG varyasyonunu dene (versiyon parametresi ile cache'i kırarak)
      setFormatIndex(nextIndex);
      setSrc(`${storageUrl}/${slug}.${FORMATS[nextIndex]}?v=${nextIndex}`);
    } else {
      setSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <div className="w-[300px] h-[300px] flex items-center justify-center overflow-hidden group">
      <img
        src={src}
        alt={name}
        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}