'use client';

import { useState, useEffect } from 'react';

interface ProductImageProps {
  sku: string;
  title: string;
  storageUrl: string;
}

export default function ProductImage({ sku, title, storageUrl }: ProductImageProps) {
  // İlk state karmaşasını önlemek için ham linki veriyoruz
  const [imgSrc, setImgSrc] = useState(`${storageUrl}/${sku}.png`);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setRetryCount(0);
    // ⚡ Sayfa yenilendiğinde tarayıcının eski hatalı hafızasını ezmek için ?t= parametresi ekledik
    setImgSrc(`${storageUrl}/${sku}.png?t=${Date.now()}`);
  }, [sku, storageUrl]);

  const handleError = () => {
    // Eğer zaten no-image aşamasına geldiysek sonsuz döngüyü önlemek için durdur
    if (imgSrc === '/no-image.webp') return;

    if (retryCount === 0) {
      // .png bulamadıysa .jpg dene (yine taze istek parametresi ile)
      setImgSrc(`${storageUrl}/${sku}.jpg?v=1`);
    } else if (retryCount === 1) {
      // .jpg de bulamadıysa varsayılan resme düş
      setImgSrc('/no-image.webp');
    }
    setRetryCount(c => c + 1);
  };

  return (
    <img
      key={imgSrc}
      src={imgSrc}
      alt={title}
      loading="lazy"
      className="max-w-full max-h-full object-contain"
      onError={handleError}
    />
  );
}