'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 dakika

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const width = window.innerWidth;

  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';

  return 'desktop';
}

function hasConsent(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const consent = localStorage.getItem(
    'cookie_consent_accepted'
  );

  return consent !== 'false';
}

function getOrCreateId(key: string): string {
  if (typeof window === 'undefined') {
    return '';
  }

  if (!hasConsent()) {
    return '';
  }

  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}

function getOrCreateSession(): string {
  const now = Date.now();

  const lastActivity =
    Number(
      sessionStorage.getItem(
        '_core_last_activity'
      )
    ) || 0;

  let sid =
    sessionStorage.getItem('_core_sid');

  if (
    !sid ||
    now - lastActivity > SESSION_TIMEOUT
  ) {
    sid = Math.floor(now / 1000).toString();

    sessionStorage.setItem(
      '_core_sid',
      sid
    );

    sessionStorage.setItem(
      '_core_session_start',
      now.toString()
    );
  }

  sessionStorage.setItem(
    '_core_last_activity',
    now.toString()
  );

  return sid;
}

function sendAnalytics(
  payload: Record<string, any>
) {
  try {
    const blob = new Blob(
      [JSON.stringify(payload)],
      {
        type: 'application/json',
      }
    );

    if (
      typeof navigator !== 'undefined' &&
      navigator.sendBeacon
    ) {
      navigator.sendBeacon(
        '/api/v1/user-preferences/sync',
        blob
      );

      return;
    }
  } catch {}

  fetch(
    '/api/v1/user-preferences/sync',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }
  ).catch(() => {});
}

export function trackCustomEvent(
  eventName: string,
  customParams: Record<string, any> = {}
) {
  if (
    typeof window === 'undefined' ||
    !hasConsent()
  ) {
    return;
  }

  const uid =
    localStorage.getItem('_core_uid') ||
    '';

  const sid = getOrCreateSession();

  const payload = {
    eventName,

    contextId: window.location.href,

    viewLabel: document.title,

    uid,

    sid,

    timestamp: Date.now(),

    language:
      navigator.language || '',

    timezone:
      Intl.DateTimeFormat().resolvedOptions()
        .timeZone,

    referrer:
      document.referrer || '$direct',

    deviceType: getDeviceType(),

    screenResolution:
      `${window.screen.width}x${window.screen.height}`,

    viewport:
      `${window.innerWidth}x${window.innerHeight}`,

    userAgent:
      navigator.userAgent,

    ...customParams,
  };

  sendAnalytics(payload);
}

function MonitorInternal() {
  const pathname = usePathname();
  const searchParams =
    useSearchParams();

  const pageStartRef =
    useRef<number>(Date.now());

  const maxScrollRef =
    useRef<number>(0);

  const pageViewSentRef =
    useRef(false);

  useEffect(() => {
    if (!hasConsent()) {
      return;
    }

    getOrCreateId('_core_uid');
    getOrCreateSession();

    pageStartRef.current =
      Date.now();

    maxScrollRef.current = 0;

    pageViewSentRef.current = false;

    const timer = setTimeout(() => {
      if (
        pageViewSentRef.current
      ) {
        return;
      }

      pageViewSentRef.current =
        true;

      trackCustomEvent(
        'page_view'
      );
    }, 150);

    return () => {
      clearTimeout(timer);

      const duration =
        Date.now() -
        pageStartRef.current;

      trackCustomEvent(
        'page_leave',
        {
          duration_ms:
            duration,

          max_scroll:
            maxScrollRef.current,
        }
      );
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!hasConsent()) {
      return;
    }

    const updateActivity = () => {
      sessionStorage.setItem(
        '_core_last_activity',
        Date.now().toString()
      );
    };

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          'hidden'
        ) {
          const duration =
            Date.now() -
            pageStartRef.current;

          trackCustomEvent(
            'page_hidden',
            {
              duration_ms:
                duration,

              max_scroll:
                maxScrollRef.current,
            }
          );
        }
      };

    const handleScroll = () => {
      const docHeight =
        document.documentElement
          .scrollHeight -
        window.innerHeight;

      if (docHeight <= 0) {
        return;
      }

      const scrollPercent =
        Math.round(
          (window.scrollY /
            docHeight) *
            100
        );

      if (
        scrollPercent >
        maxScrollRef.current
      ) {
        maxScrollRef.current =
          scrollPercent;
      }

      if (
        scrollPercent >= 25 &&
        scrollPercent < 50
      ) {
        trackCustomEvent(
          'scroll_25'
        );
      }

      if (
        scrollPercent >= 50 &&
        scrollPercent < 75
      ) {
        trackCustomEvent(
          'scroll_50'
        );
      }

      if (
        scrollPercent >= 75 &&
        scrollPercent < 100
      ) {
        trackCustomEvent(
          'scroll_75'
        );
      }

      if (
        scrollPercent >= 100
      ) {
        trackCustomEvent(
          'scroll_100'
        );
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    );

    window.addEventListener(
      'mousemove',
      updateActivity
    );

    window.addEventListener(
      'keydown',
      updateActivity
    );

    window.addEventListener(
      'touchstart',
      updateActivity
    );

    window.addEventListener(
      'click',
      updateActivity
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

      window.removeEventListener(
        'scroll',
        handleScroll
      );

      window.removeEventListener(
        'mousemove',
        updateActivity
      );

      window.removeEventListener(
        'keydown',
        updateActivity
      );

      window.removeEventListener(
        'touchstart',
        updateActivity
      );

      window.removeEventListener(
        'click',
        updateActivity
      );
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    const nav =
      performance.getEntriesByType(
        'navigation'
      )[0] as
        | PerformanceNavigationTiming
        | undefined;

    if (!nav) {
      return;
    }

    const timer = setTimeout(() => {
      trackCustomEvent(
        'performance_metrics',
        {
          dns:
            Math.round(
              nav.domainLookupEnd -
                nav.domainLookupStart
            ),

          tcp:
            Math.round(
              nav.connectEnd -
                nav.connectStart
            ),

          ttfb:
            Math.round(
              nav.responseStart -
                nav.requestStart
            ),

          dom_loaded:
            Math.round(
              nav.domContentLoadedEventEnd -
                nav.startTime
            ),

          page_loaded:
            Math.round(
              nav.loadEventEnd -
                nav.startTime
            ),
        }
      );
    }, 3000);

    return () =>
      clearTimeout(timer);
  }, []);

  return null;
}

export default function CoreStatusMonitor() {
  return (
    <Suspense fallback={null}>
      <MonitorInternal />
    </Suspense>
  );
}