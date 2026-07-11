'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Sayfa her değiştiğinde kendi gizli API'mize POST isteği atıyoruz
    // İçinde asla 'collect', 'google', 'gtm' geçmediği için AdBlocker izler ama dokunamaz
    fetch('/api/v1/internal-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_path: pathname,
        title: document.title,
      }),
    }).catch((err) => console.log('Analytics bypass safe log:', err));
  }, [pathname]);

  return null; // Görsel bir bileşen değil, sadece arka planda çalışır
}