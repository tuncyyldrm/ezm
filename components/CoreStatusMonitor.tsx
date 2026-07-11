'use client';

import {
  Suspense,
  useEffect,
  useRef,
} from 'react';

import {
  usePathname,
  useSearchParams,
} from 'next/navigation';

const SESSION_TIMEOUT =
  30 * 60 * 1000;

function hasConsent(): boolean {

  if (
    typeof window === 'undefined'
  ) {
    return false;
  }

  return (
    localStorage.getItem(
      'cookie_consent_accepted'
    ) !== 'false'
  );
}

function createUUID(){

  if(
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
  ){
    return crypto.randomUUID();
  }

  return (
    Math.random()
      .toString(36)
      .substring(2)
    +
    Date.now()
  );
}

function getDeviceType():
'mobile'
|
'tablet'
|
'desktop'
{

  if(
    typeof navigator === 'undefined'
  ){
    return 'desktop';
  }

  const ua =
    navigator.userAgent.toLowerCase();

  if(
    /ipad|tablet|playbook|silk/
    .test(ua)
  ){
    return 'tablet';
  }

  if(
    /android|iphone|ipod|mobile/
    .test(ua)
  ){
    return 'mobile';
  }

  return 'desktop';
}

function getPageType(
  pathname:string
){

  if(
    pathname === '/'
  ){
    return 'home';
  }

  if(
    pathname.startsWith('/product/')
  ){
    return 'product';
  }

  if(
    pathname.startsWith('/admin')
  ){
    return 'admin';
  }

  return 'category';
}

function getOrCreateId(
  key:string
){

  if(
    !hasConsent()
  ){
    return '';
  }

  let id =
    localStorage.getItem(key);

  if(!id){

    id =
      createUUID();

    localStorage.setItem(
      key,
      id
    );
  }

  return id;
}

function getVisitorType(){

  const key =
    '_core_first_visit';

  const first =
    localStorage.getItem(key);

  if(!first){

    localStorage.setItem(
      key,
      Date.now().toString()
    );

    return 'new';
  }

  return 'returning';
}

function getOrCreateSession(){

  const now =
    Date.now();

  const last =
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

  if(
    !sid ||
    now - last > SESSION_TIMEOUT
  ){

    sid =
      Math.floor(
        now / 1000
      )
      .toString();

    sessionCount++;

    sessionStorage.setItem(
      '_core_sid',
      sid
    );

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
    sessionCount
  };
}

function sendAnalytics(
  payload:Record<string,any>
){

  fetch(
    '/api/v1/user-preferences/sync',
    {
      method:'POST',

      headers:{
        'Content-Type':
          'application/json'
      },

      body:
        JSON.stringify(payload),

      keepalive:true
    }
  )
  .catch(()=>{
    // sessiz geç
  });

}

export function trackCustomEvent(
  eventName:string,
  customParams:
  Record<string,any>={}
){

  if(
    typeof window === 'undefined'
    ||
    !hasConsent()
  ){
    return;
  }

  const session =
    getOrCreateSession();

  const uid =
    getOrCreateId(
      '_core_uid'
    );

  const connection =
    (navigator as any)
      ?.connection;

  sendAnalytics({

    eventName,

    contextId:
      window.location.href,

    viewLabel:
      document.title,

    uid,

    sid:
      session.sid,

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
      connection?.effectiveType || '',

    downlink:
      connection?.downlink || null,

    rtt:
      connection?.rtt || null,

    engagement_time_msec:
      customParams.engagement_time_msec
      ||
      100,

    ...customParams

  });

}

function MonitorInternal(){

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const pageStart =
    useRef(Date.now());

  const activeStart =
    useRef(Date.now());

  const activeTime =
    useRef(0);

  const maxScroll =
    useRef(0);

  const sentLeave =
    useRef(false);

  const scrollMarks =
    useRef(
      new Set<number>()
    );

  useEffect(()=>{

    if(
      !hasConsent()
    ){
      return;
    }

    pageStart.current =
      Date.now();

    activeStart.current =
      Date.now();

    activeTime.current =
      0;

    maxScroll.current =
      0;

    sentLeave.current =
      false;

    scrollMarks.current.clear();

    trackCustomEvent(
      'page_view',
      {
        engagement_time_msec:100
      }
    );

    const sendLeave =
      ()=>{

        if(
          sentLeave.current
        ){
          return;
        }

        sentLeave.current =
          true;

        activeTime.current +=
          Date.now()
          -
          activeStart.current;

        trackCustomEvent(
          'page_leave',
          {

            duration_ms:
              Date.now()
              -
              pageStart.current,

            engagement_time_msec:
              activeTime.current,

            max_scroll:
              maxScroll.current

          }
        );

      };

    window.addEventListener(
      'beforeunload',
      sendLeave
    );

    return()=>{

      window.removeEventListener(
        'beforeunload',
        sendLeave
      );

      sendLeave();

    };

  },[
    pathname,
    searchParams
  ]);

  useEffect(()=>{

    if(
      !hasConsent()
    ){
      return;
    }

    const visibilityHandler =
      ()=>{

        if(
          document.visibilityState ===
          'hidden'
        ){

          activeTime.current +=
            Date.now()
            -
            activeStart.current;

          trackCustomEvent(
            'page_hidden',
            {
              engagement_time_msec:
                activeTime.current
            }
          );

        }
        else{

          activeStart.current =
            Date.now();

        }

      };

    const scrollHandler =
      ()=>{

        const height =
          document.documentElement
          .scrollHeight
          -
          window.innerHeight;

        if(
          height <= 0
        ){
          return;
        }

        const percent =
          Math.round(
            window.scrollY /
            height *
            100
          );

        maxScroll.current =
          Math.max(
            maxScroll.current,
            percent
          );

        [25,50,75,100]
        .forEach(
          level=>{

            if(
              percent >= level
              &&
              !scrollMarks.current.has(level)
            ){

              scrollMarks.current.add(level);

              trackCustomEvent(
                `scroll_${level}`
              );

            }

          }
        );

      };

    document.addEventListener(
      'visibilitychange',
      visibilityHandler
    );

    window.addEventListener(
      'scroll',
      scrollHandler,
      {
        passive:true
      }
    );

    return()=>{

      document.removeEventListener(
        'visibilitychange',
        visibilityHandler
      );

      window.removeEventListener(
        'scroll',
        scrollHandler
      );

    };

  },[]);

  return null;

}

export default function CoreStatusMonitor(){

  return (

    <Suspense
      fallback={null}
    >

      <MonitorInternal />

    </Suspense>

  );

}