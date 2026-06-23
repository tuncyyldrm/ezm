'use client';

import { useState, useEffect } from 'react';

interface ProductImageProps {
  sku: string;
  title: string;
  storageUrl: string;
}

export default function ProductImage({ sku, title, storageUrl }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(`${storageUrl}/${sku}.png`);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setImgSrc(`${storageUrl}/${sku}.png`);
    setRetryCount(0);
  }, [sku, storageUrl]);

  const handleError = () => {
    if (retryCount === 0) setImgSrc(`${storageUrl}/${sku}.jpg`);
    else if (retryCount === 1) setImgSrc('/no-image.webp');
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