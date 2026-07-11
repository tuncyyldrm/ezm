// components/CoreStatusMonitor.tsx
'use client';

import { usePathname } from 'next/navigation'; // ← useSearchParams'ı kaldır
import { useEffect, useRef, useCallback } from 'react';

const ANALYTICS_ENDPOINT = '/api/v1/user-preferences/sync';

const STORAGE = {
  userId: '__ezm_s',
  lastVisit: '__ezm_v',
  pageLog: '__ezm_p',
  userType: '__ezm_t',
  sessionRef: '__ezm_r',
} as const;

export default function CoreStatusMonitor() {
  const pathname = usePathname();
  // ❌ const searchParams = useSearchParams(); // BUNU SİL
  const isInitialMount = useRef(true);
  const pageEnterTime = useRef(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Client ID - localStorage (kalıcı)
  const getUserId = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    
    try {
      let id = localStorage.getItem(STORAGE.userId);
      if (!id) {
        id = 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(STORAGE.userId, id);
      }
      return id;
    } catch {
      return 'u_' + Date.now().toString(36);
    }
  }, []);

  // Session ID - sessionStorage
  const getSessionRef = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    
    const now = Date.now();
    const lastVisit = Number(localStorage.getItem(STORAGE.lastVisit) || 0);
    const timeout = 30 * 60 * 1000;
    
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

  // Analytics gönderme
  const sendData = useCallback(async (data: Record<string, any>) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      if (navigator.sendBeacon && data.meta?.action === 'page_exit') {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
        return;
      }
      
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
    // ✅ searchParams yerine window.location.search kullan
    const fullUrl = window.location.origin + pathname + window.location.search;
    
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
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setTimeout(() => sendData(data), 50);
    } else {
      sendData(data);
    }
    
    pageEnterTime.current = Date.now();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pathname, getUserId, getSessionRef, updatePageLog, sendData]);
  // ✅ searchParams bağımlılığını kaldırdık

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

// Yardımcı fonksiyon
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