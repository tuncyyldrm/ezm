'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_accepted');
    if (consent === null) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_accepted', 'true');
    setIsOpen(false);
    window.location.reload();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent_accepted', 'false');
    setIsOpen(false);
    localStorage.removeItem('_core_uid');
    sessionStorage.removeItem('_core_sid');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-950 md:bottom-4 md:right-4 md:left-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
            <span>🍪</span> Çerez Ayarları
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-400 leading-normal">
            Deneyiminizi optimize etmek için yasal çerezler kullanıyoruz. Detaylar:{' '}
            <Link href="/cerez-politikasi" className="underline text-gray-900 dark:text-gray-100 font-medium hover:text-gray-700">
              Çerez Politikası
            </Link>
          </p>
        </div>
        <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium pt-1 border-t border-gray-100 dark:border-gray-900">
          <button
            onClick={handleDecline}
            className="rounded px-2.5 py-1 text-gray-600 border border-transparent transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
          >
            Reddet
          </button>
          <button
            onClick={handleAccept}
            className="rounded bg-gray-900 px-3 py-1 text-white transition hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}