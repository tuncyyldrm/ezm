'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function CoreStatusMonitor() {
  const pathname = usePathname();

  useEffect(() => {
    // uBlock'un asla şüphelenmeyeceği, tamamen standart bir iç API isteği
    fetch('/api/v1/user-preferences/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contextId: window.location.origin + pathname,
        viewLabel: document.title,
      }),
    }).catch(() => {
      // Hata oluşursa konsolu kirletmemek için sessiz kalıyoruz
    });
  }, [pathname]);

  return null;
}