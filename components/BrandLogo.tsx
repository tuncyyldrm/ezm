'use client';
import { useState } from 'react';

export default function BrandLogo({ name, storageUrl }: { name: string; storageUrl: string }) {
  // Marka adını dosya ismine uygun hale getiriyoruz (Örn: "RENAULT - DACIA" -> "renault-dacia")
  const cleanName = name.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w\-]+/g, '');
  const [src, setSrc] = useState(`${storageUrl}/${cleanName}.png`);

  return (
    <img
      src={src}
      alt={name}
      className="max-w-full max-h-full object-contain"
      onError={() => setSrc('/no-image.webp')}
    />
  );
}