'use client';

import { useState, useEffect } from 'react';

interface ProductImageProps {
  sku: string;
  title: string;
  storageUrl: string;
}

export default function ProductImage({ sku, title, storageUrl }: ProductImageProps) {
  // Cache-breaking ortadan kaldırıldı. Doğrudan temiz statik URL ile başlatıyoruz.
  const [imgSrc, setImgSrc] = useState(`${storageUrl}/${sku}.jpg`);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setRetryCount(0);
    setImgSrc(`${storageUrl}/${sku}.jpg`);
  }, [sku, storageUrl]);

  const handleError = () => {
    if (imgSrc === '/no-image.webp') return;

    if (retryCount === 0) {
      // .png bulunamadıysa .jpg sürümünü kontrol et (Parametresiz, temiz URL)
      setImgSrc(`${storageUrl}/${sku}.jpg`);
    } else if (retryCount === 1) {
      // O da yoksa global fallback resmine geç
      setImgSrc('/no-image.webp');
    }
    setRetryCount(c => c + 1);
  };

  return (
    <img
      key={imgSrc}
      src={imgSrc}
      alt={`${title} - Oto Yedek Parça Görseli`} // Google Görseller indekslemesi için semantik eklenti
      loading="lazy"
      className="max-w-full max-h-full object-contain"
      onError={handleError}
    />
  );
}