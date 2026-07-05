'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Sayfa kaydırıldıkça butonun görünüp görünmeyeceğini kontrol et
  useEffect(() => {
    const toggleVisibility = () => {
      // Kullanıcı 400 pikselden fazla aşağı kaydırdıysa butonu göster
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Yukarı kaydırma aksiyonu
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      type="button"
      aria-label="Yukarı Çık"
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 hover:-translate-y-1.5 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/30 group animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Modern Yukarı Oku İkonu (Hover durumunda zıplama/yukarı ivmelenme efektli) */}
      <svg
        className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}