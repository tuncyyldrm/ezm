'use client';

import { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  sku: string;
  title: string;
  storageUrl: string;
  sizes?: string;
  priority?: boolean;
}

const FALLBACK_IMAGE = '/no-image.svg';

export default function ProductImage({
  sku,
  title,
  storageUrl,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px',
  priority = false,
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(`${storageUrl}/${sku}.jpg`);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsFallback(false);
      setImgSrc(`${storageUrl}/${sku}.jpg`);
    });
  }, [sku, storageUrl]);

  const handleError = () => {
    if (!isFallback) {
      setIsFallback(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        key={imgSrc}
        src={imgSrc}
        alt={`${title} - Oto Yedek Parça Görseli`}
        fill
        sizes={sizes}
        className="object-contain p-1"
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
      />
    </div>
  );
}