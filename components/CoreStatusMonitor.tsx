'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SESSION_TIMEOUT = 30 * 60 * 1000;

function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    localStorage.getItem(
      'cookie_consent_accepted'
    ) !== 'false'
  );
}

function getDeviceType():
  | 'mobile'
  | 'tablet'
  | 'desktop' {
  if (typeof navigator === 'undefined') {
    return 'desktop';
  }

  const ua = navigator.userAgent;

  if (
    /ipad|tablet|playbook|silk/i.test(
      ua
    )
  ) {
    return 'tablet';
  }

  if (
    /android|iphone|ipod|mobile/i.test(
      ua
    )
  ) {
    return 'mobile';
  }

  return 'desktop';
}

function getPageType(
  pathname: string
): string {
  if (pathname === '/') {
    return 'home';
  }

  if (
    pathname.startsWith('/product/')
  ) {
    return 'product';
  }

  if (
    pathname.startsWith('/admin')
  ) {
    return 'admin';
  }

  if (
    pathname.startsWith('/api')
  ) {
    return 'api';
  }

  return 'category';
}

function getOrCreateId(
  key: string
): string {
  if (
    typeof window === 'undefined' ||
    !hasConsent()
  ) {
    return '';
  }

  let id =
    localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();

    localStorage.setItem(
      key,
      id
    );
  }

  return id;
}

function getVisitorType():
  | 'new'
  | 'returning' {
  const firstVisit =
    localStorage.getItem(
      '_core_first_visit'
    );

  if (!firstVisit) {
    localStorage.setItem(
      '_core_first_visit',
      Date.now().toString()
    );

    return 'new';
  }

  return 'returning';
}

function getOrCreateSession(): {
  sid: string;
  sessionCount: number;
} {
  const now = Date.now();

  const lastActivity =
    Number(
      sessionStorage.getItem(
        '_core_last_activity'
      )
    ) || 0;

  let sid =
    sessionStorage.getItem(
      '_core_sid'
    );

  let sessionCount =
    Number(
      localStorage.getItem(
        '_core_session_count'
      )
    ) || 0;

  if (
    !sid ||
    now - lastActivity >
      SESSION_TIMEOUT
  ) {
    sid = Math.floor(
      now / 1000
    ).toString();

    sessionStorage.setItem(
      '_core_sid',
      sid
    );

    sessionStorage.setItem(
      '_core_session_start',
      now.toString()
    );

    sessionCount++;

    localStorage.setItem(
      '_core_session_count',
      sessionCount.toString()
    );
  }

  sessionStorage.setItem(
    '_core_last_activity',
    now.toString()
  );

  return {
    sid,
    sessionCount,
  };
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
      body: JSON.stringify(
        payload
      ),
      keepalive: true,
    }
  ).catch(() => {});
}

export function trackCustomEvent(
  eventName: string,
  customParams: Record<
    string,
    any
  > = {}
) {
  if (
    typeof window === 'undefined' ||
    !hasConsent()
  ) {
    return;
  }

  const uid =
    localStorage.getItem(
      '_core_uid'
    ) || '';

  const session =
    getOrCreateSession();

  const connection = (
    navigator as any
  )?.connection;

  sendAnalytics({
    eventName,

    contextId:
      window.location.href,

    viewLabel:
      document.title,

    uid,

    sid: session.sid,

    timestamp:
      Date.now(),

    language:
      navigator.language,

    timezone:
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone,

    referrer:
      document.referrer ||
      '$direct',

    deviceType:
      getDeviceType(),

    pageType:
      getPageType(
        window.location.pathname
      ),

    visitorType:
      getVisitorType(),

    sessionCount:
      session.sessionCount,

    screenResolution:
      `${window.screen.width}x${window.screen.height}`,

    viewport:
      `${window.innerWidth}x${window.innerHeight}`,

    userAgent:
      navigator.userAgent,

    networkType:
      connection
        ?.effectiveType || '',

    downlink:
      connection?.downlink ||
      null,

    rtt:
      connection?.rtt ||
      null,

    ...customParams,
  });
}

function MonitorInternal() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const pageStartRef =
    useRef(Date.now());

  const activeStartRef =
    useRef(Date.now());

  const activeTimeRef =
    useRef(0);

  const maxScrollRef =
    useRef(0);

  const pageViewSentRef =
    useRef(false);

  const leavingRef =
    useRef(false);

  const milestonesRef =
    useRef(
      new Set<number>()
    );

  useEffect(() => {
    if (!hasConsent()) {
      return;
    }

    getOrCreateId(
      '_core_uid'
    );

    getOrCreateSession();

    pageStartRef.current =
      Date.now();

    activeStartRef.current =
      Date.now();

    activeTimeRef.current = 0;

    maxScrollRef.current = 0;

    milestonesRef.current.clear();

    pageViewSentRef.current =
      false;

    leavingRef.current = false;

    const timer =
      setTimeout(() => {
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

    const sendLeave =
      () => {
        if (
          leavingRef.current
        ) {
          return;
        }

        leavingRef.current =
          true;

        activeTimeRef.current +=
          Date.now() -
          activeStartRef.current;

        trackCustomEvent(
          'page_leave',
          {
            duration_ms:
              Date.now() -
              pageStartRef.current,

            active_time_ms:
              activeTimeRef.current,

            max_scroll:
              maxScrollRef.current,
          }
        );
      };

    window.addEventListener(
      'beforeunload',
      sendLeave
    );

    return () => {
      clearTimeout(timer);

      window.removeEventListener(
        'beforeunload',
        sendLeave
      );

      sendLeave();
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!hasConsent()) {
      return;
    }

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          'hidden'
        ) {
          activeTimeRef.current +=
            Date.now() -
            activeStartRef.current;

          trackCustomEvent(
            'page_hidden',
            {
              active_time_ms:
                activeTimeRef.current,
            }
          );
        }

        if (
          document.visibilityState ===
          'visible'
        ) {
          activeStartRef.current =
            Date.now();
        }
      };

    const handleScroll =
      () => {
        const docHeight =
          document
            .documentElement
            .scrollHeight -
          window.innerHeight;

        if (
          docHeight <= 0
        ) {
          return;
        }

        const percent =
          Math.round(
            (window.scrollY /
              docHeight) *
              100
          );

        if (
          percent >
          maxScrollRef.current
        ) {
          maxScrollRef.current =
            percent;
        }

        [25, 50, 75, 100]
          .filter(
            (m) =>
              percent >= m &&
              !milestonesRef.current.has(
                m
              )
          )
          .forEach((m) => {
            milestonesRef.current.add(
              m
            );

            trackCustomEvent(
              `scroll_${m}`
            );
          });
      };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      }
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
    };
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