'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const FORMATS = ['jpg', 'JPG'];
// Kırık imaj yerine yerel public klasörünüzde sabit bir SVG veya asset tutmanız SEO ve hız için daha iyidir.
const FALLBACK_IMAGE = '/images/placeholder.svg'; 

// 🎯 ÇÖZÜM: Date.now() yerine projenin yayına alınma tarihini veya sabit bir versiyon (örn: v=1) kullanın.
// Bu sayede tarayıcı sayfalar arası geçişte resmi cache'ten okur, veri tabanında resim güncellendiğinde sürüm değiştirirsiniz.
const STATIC_VERSION = 'v1.0.2';

export default function CategoryImage({ 
  slug, 
  name, 
  storageUrl 
}: { 
  slug: string; 
  name: string; 
  storageUrl: string 
}) {
  const [formatIndex, setFormatIndex] = useState(0);
  const [src, setSrc] = useState(`${storageUrl}/${slug}.${FORMATS[0]}?ver=${STATIC_VERSION}`);

  useEffect(() => {
    setFormatIndex(0);
    setSrc(`${storageUrl}/${slug}.${FORMATS[0]}?ver=${STATIC_VERSION}`);
  }, [slug, storageUrl]);

  const handleError = () => {
    if (src === FALLBACK_IMAGE) return;

    const nextIndex = formatIndex + 1;
    
    if (nextIndex < FORMATS.length) {
      setFormatIndex(nextIndex);
      setSrc(`${storageUrl}/${slug}.${FORMATS[nextIndex]}?ver=${STATIC_VERSION}&alt=${nextIndex}`);
    } else {
      setSrc(FALLBACK_IMAGE);
    }
  };

  // 🏷️ Image SEO: Arama terimlerine uygun alt etiket kombinasyonu
  const seoAltText = `${name} Kategorisi - Tüm Muadil ve OEM Yedek Parçaları`;

  return (
    // Next.js Image bileşeni için kapsayıcının relative olması ve boyut sınırlarının çizilmesi CLS'yi engeller.
    <div className="relative w-[300px] h-[300px] flex items-center justify-center overflow-hidden group bg-white-50 rounded-xl">
      <Image
        src={src}
        alt={seoAltText}
        title={`${name} Modelleri ve Soket Listesi`}
        // fill prop'u resmin kapsayıcıyı taşmadan doldurmasını sağlar
        fill
        sizes="300px"
        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        onError={handleError}
        // İlk yüklemede sayfa hızını (LCP) korumak için lazy loading aktiftir
        loading="lazy"
        // Dışarıdan Supabase URL'i geldiği için Next.js config'e domain eklenmelidir.
        unoptimized={true} 
      />
    </div>
  );
}