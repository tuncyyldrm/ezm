'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductImage from './ProductImage';

interface ProductImageZoomProps {
  sku: string;
  title: string;
  storageUrl: string;
  imageExtension?: string;
}

export default function ProductImageZoom({ sku, title, storageUrl, imageExtension = 'jpg' }: ProductImageZoomProps) {
  const [showModal, setShowModal] = useState(false);
  const imgSrc = `${storageUrl}/${sku}.${imageExtension}`;

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Performans & Hız: Modal açılma ihtimaline karşı resmi arka planda önceden yükle (Preload)
  const handleMouseEnter = () => {
    const img = new Image();
    img.src = imgSrc;
  };

  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    // Scrollbar kaybolduğunda sayfanın sağa/sola sıçramasını engeller
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, closeModal]);

  return (
    <>
      {/* UX Düzeltmesi: Klavye ile odaklanabilir (Tab) ve Enter ile açılabilir hale getirildi */}
      <div 
        onClick={() => setShowModal(true)} 
        onMouseEnter={handleMouseEnter}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowModal(true); } }}
        className="cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        role="button"
        tabIndex={0}
        aria-label={`${title} görselini büyüt`}
      >
        <ProductImage sku={sku} title={title} storageUrl={storageUrl} />
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-0 py-16 animate-fade-in"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} zoom görünümü`}
        >
          {/* Kapat Butonu */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white text-xl bg-white/10 hover:bg-white/20 active:scale-95 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all"
            aria-label="Kapat"
          >
            ✕
          </button>

          {/* SKU Bilgisi */}
          <div className="absolute top-4 left-4 text-white/70 bg-white/10 px-3 py-1.5 rounded-lg text-sm font-mono z-10 select-all">
            {sku}
          </div>

          {/* Zoom Yapılmış Ana Görsel */}
          <img
            src={imgSrc}
            alt={title}
            className="h-full object-contain z-5 max-h-[90vh] max-w-full select-none"
            onClick={(e) => e.stopPropagation()}
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/no-image.webp';
            }}
          />

          {/* Bilgilendirme Alt Metni */}
          <div className="absolute bottom-4 text-white/50 text-xs bg-black/40 px-3 py-1 rounded-full pointer-events-none">
            Kapatmak için ESC, dış alana tıkla veya ✕
          </div>
        </div>
      )}
    </>
  );
}