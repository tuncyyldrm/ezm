'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const getOrCreateId = (key: string) => {
  if (typeof window === 'undefined') return '';
  
  // EĞER KULLANICI REDDETTİYSE ID ÜRETME, BOŞ DÖN
  const consent = localStorage.getItem('cookie_consent_accepted');
  if (consent === 'false') return '';

  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem(key, id);
  }
  return id;
};

export const trackCustomEvent = (eventName: string, customParams: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;
  
  // EĞER KULLANICI REDDETTİYSE API'YE İSTEK ATMA
  const consent = localStorage.getItem('cookie_consent_accepted');
  if (consent === 'false') return;

  const uid = localStorage.getItem('_core_uid') || '';
  const sid = sessionStorage.getItem('_core_sid') || '';

  fetch('/api/v1/user-preferences/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      contextId: window.location.href,
      viewLabel: document.title,
      uid,
      sid: parseInt(sid, 10) || Math.floor(Date.now() / 1000),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      referrer: document.referrer || '$direct',
      ...customParams
    }),
  }).catch(() => {});
};

function MonitorInternal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Kullanıcı reddettiyse takibi tamamen durdur
    const consent = localStorage.getItem('cookie_consent_accepted');
    if (consent === 'false') return;

    getOrCreateId('_core_uid');
    let sessionId = sessionStorage.getItem('_core_sid');
    if (!sessionId) {
      sessionId = Math.floor(Date.now() / 1000).toString();
      sessionStorage.setItem('_core_sid', sessionId);
    }

    const timer = setTimeout(() => {
      trackCustomEvent('page_view');
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

export default function CoreStatusMonitor() {
  return (
    <Suspense fallback={null}>
      <MonitorInternal />
    </Suspense>
  );
}