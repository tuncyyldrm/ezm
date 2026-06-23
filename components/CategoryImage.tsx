'use client';
import { useState } from 'react';

export default function CategoryImage({ slug, name, storageUrl }: { slug: string; name: string; storageUrl: string }) {
  const [src, setSrc] = useState(`${storageUrl}/${slug}.png`);
  return (
    <img
      src={src}
      alt={name}
      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
      onError={() => setSrc('/no-image.webp')}
    />
  );
}