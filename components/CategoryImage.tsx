'use client';

import { useState, useEffect, startTransition } from 'react';
import Image from 'next/image';

const FALLBACK_IMAGE = '/no-image.svg';

export default function CategoryImage({ 
  slug, 
  name, 
  storageUrl,
  imageUrl
}: { 
  slug: string; 
  name: string; 
  storageUrl: string;
  imageUrl?: string | null;
}) {
  const [src, setSrc] = useState(imageUrl || `${storageUrl}/${slug}.jpg`);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsFallback(false);
      setSrc(imageUrl || `${storageUrl}/${slug}.jpg`);
    });
  }, [slug, storageUrl, imageUrl]);

  const handleError = () => {
    if (!isFallback) {
      setIsFallback(true);
      setSrc(FALLBACK_IMAGE);
    }
  };

  const seoAltText = `${name} Kategorisi - Tüm Muadil ve OEM Yedek Parçaları`;

  return (
    <div className="relative w-full h-full aspect-square flex items-center justify-center overflow-hidden rounded-xl">
      <Image
        key={src}
        src={src}
        alt={seoAltText}
        title={`${name} Modelleri ve Soket Listesi`}
        fill
        sizes="(max-width: 640px) 120px, 140px"
        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}