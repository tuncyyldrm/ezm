// components/CoreStatusMonitor.tsx (güncellenmiş kısım)
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';

const ANALYTICS_ENDPOINT = '/api/v1/user-preferences/sync';

// Storage anahtarları (gizlenmiş)
const STORAGE = {
  userId: '__ezm_s',      // session
  lastVisit: '__ezm_v',   // last visit timestamp  
  pageLog: '__ezm_p',     // page history
  userType: '__ezm_t',    // user tier
  sessionRef: '__ezm_r',  // session reference
} as const;

export default function CoreStatusMonitor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const pageEnterTime = useRef(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Client ID - localStorage (kalıcı)
  const getUserId = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    
    try {
      let id = localStorage.getItem(STORAGE.userId);
      if (!id) {
        // Daha güvenli random ID
        id = 'u_' + Date.now().toString(36) + crypto.randomUUID?.().substring(0, 8) || Math.random().toString(36).substring(2, 10);
        localStorage.setItem(STORAGE.userId, id);
      }
      return id;
    } catch {
      return 'u_' + Date.now().toString(36);
    }
  }, []);

  // Session ID - sessionStorage (sekme kapandığında silinir)
  const getSessionRef = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    
    const now = Date.now();
    const lastVisit = Number(localStorage.getItem(STORAGE.lastVisit) || 0);
    const timeout = 30 * 60 * 1000; // 30 dakika
    
    try {
      let sessionRef = sessionStorage.getItem(STORAGE.sessionRef);
      
      if (!sessionRef || now - lastVisit > timeout) {
        sessionRef = 's_' + now.toString(36) + Math.random().toString(36).substring(2, 6);
        sessionStorage.setItem(STORAGE.sessionRef, sessionRef);
      }
      
      localStorage.setItem(STORAGE.lastVisit, String(now));
      return sessionRef;
    } catch {
      return 's_' + now.toString(36);
    }
  }, []);

  // Sayfa geçmişi
  const updatePageLog = useCallback((currentPath: string): string[] => {
    if (typeof window === 'undefined') return [currentPath];
    
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE.pageLog) || '[]');
      history.push({
        p: currentPath,
        t: Date.now(),
      });
      
      const recent = history.slice(-20);
      localStorage.setItem(STORAGE.pageLog, JSON.stringify(recent));
      return recent.map((h: any) => h.p);
    } catch {
      return [currentPath];
    }
  }, []);

  // Analytics gönderme (güvenli)
  const sendData = useCallback(async (data: Record<string, any>) => {
    // Önceki isteği iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      // Navigator.sendBeacon (sayfa kapanırken)
      if (navigator.sendBeacon && data.meta?.action === 'page_exit') {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
        return;
      }
      
      // Normal fetch
      await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        keepalive: data.meta?.action === 'page_exit',
      });
    } catch (error: any) {
      if (error?.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
        console.debug('Analytics send failed:', error.message);
      }
    }
  }, []);

  // Sayfa görüntüleme tracking
  useEffect(() => {
    const fullUrl = window.location.origin + pathname + 
      (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    const data = {
      contextId: fullUrl,
      viewLabel: document.title,
      userId: getUserId(),
      sessionRef: getSessionRef(),
      status: {
        tier: localStorage.getItem(STORAGE.userType) || 'visitor',
        visited: updatePageLog(fullUrl),
      },
      perf: isInitialMount.current ? {
        load: Math.round(performance.now()),
      } : undefined,
    };
    
    // İlk yüklemede gecikmeli gönder (sayfa performansını etkilemesin)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setTimeout(() => sendData(data), 50);
    } else {
      sendData(data);
    }
    
    pageEnterTime.current = Date.now();
    
    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pathname, searchParams, getUserId, getSessionRef, updatePageLog, sendData]);

  // Sayfadan ayrılma
  useEffect(() => {
    const handleExit = () => {
      const timeSpent = Math.round((Date.now() - pageEnterTime.current) / 1000);
      
      sendData({
        contextId: window.location.href,
        viewLabel: document.title,
        userId: getUserId(),
        sessionRef: getSessionRef(),
        meta: {
          action: 'page_exit',
          value: timeSpent,
          category: 'engagement',
          label: 'time_on_page',
        },
      });
    };
    
    window.addEventListener('beforeunload', handleExit);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleExit();
      }
    });
    
    return () => {
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [getUserId, getSessionRef, sendData]);

  return null;
}

// Export edilen yardımcı fonksiyonlar (diğer component'lerden çağırmak için)
export function sendEvent(action: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  const data = {
    contextId: window.location.href,
    viewLabel: document.title,
    userId: localStorage.getItem('__ezm_s') || '',
    sessionRef: sessionStorage.getItem('__ezm_r') || '',
    meta: {
      action,
      value: params || {},
      category: params?.category || 'interaction',
      label: params?.label || action,
    },
  };
  
  fetch('/api/v1/user-preferences/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}