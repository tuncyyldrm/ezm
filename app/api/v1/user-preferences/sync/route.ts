// app/api/v1/user-preferences/sync/route.ts

import { NextResponse } from 'next/server';

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
const GA_API_SECRET = process.env.GA_API_SECRET;

const DEBUG_GA = false; // Hata ayıklama gerekirse true yapabilirsin

const BOT_REGEX =
  /bot|crawler|spider|crawl|GPTBot|ClaudeBot|AhrefsBot|SemrushBot|YandexBot|bingbot|Googlebot/i;

const MAX_EVENT_NAME_LENGTH = 40;

function generateClientId() {
  return `${Math.floor(Math.random() * 1000000000)}.${Date.now()}`;
}

type GeoResult = {
  country: string;
  region: string;
  city: string;
};

async function resolveGeo(ip: string): Promise<GeoResult> {
  try {
    if (!ip) {
      return { country: '', region: '', city: '' };
    }

    const response = await fetch(`https://ipwho.is/${ip}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Geo lookup failed: ${response.status}`);
    }

    const geo = await response.json();
    if (!geo?.success) {
      throw new Error('Geo lookup unsuccessful');
    }

    return {
      country: geo.country_code || '',
      region: geo.region_code || '',
      city: geo.city || '',
    };
  } catch {
    return { country: '', region: '', city: '' };
  }
}

export async function POST(request: Request) {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
      console.error('[Analytics] Missing GA configuration');
      return NextResponse.json({ status: 'analytics_disabled' }, { status: 500 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
    }

    const {
      eventName,
      contextId,
      viewLabel,
      uid,
      sid,
      screenResolution,
      language,
      timezone,
      referrer,
      engagement_time_msec,
      deviceType,
      viewport,
      ...restParams
    } = body || {};

    if (
      typeof eventName !== 'string' ||
      !eventName.trim() ||
      eventName.length > MAX_EVENT_NAME_LENGTH
    ) {
      return NextResponse.json({ status: 'invalid_event_name' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';

    if (BOT_REGEX.test(userAgent)) {
      return NextResponse.json({ status: 'ignored_bot' }, { status: 200 });
    }

    // 1. DÜZELTME: Vercel üzerinde en kararlı IP başlığına öncelik veriyoruz
    let rawIp =
      request.headers.get('x-vercel-forwarded-for') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '';

    // 2. DÜZELTME: IP adresinin sonundaki port numarasını (:49152 gibi) temizliyoruz
    let clientIp = rawIp.trim();
    if (clientIp.includes(':') && !clientIp.includes('[')) {
      // Eğer IPv6 değilse ve port içeriyorsa iki noktadan sonrasını atıyoruz
      clientIp = clientIp.split(':')[0];
    }

    let geo: GeoResult = {
      country: request.headers.get('x-vercel-ip-country') || '',
      region: request.headers.get('x-vercel-ip-country-region') || '',
      city: request.headers.get('x-vercel-ip-city') || '',
    };

    if (!geo.country && clientIp) {
      geo = await resolveGeo(clientIp);
    }

    let pagePath = '/';
    const campaignParams: Record<string, string> = {};

    try {
      if (typeof contextId === 'string' && contextId) {
        const urlObj = new URL(contextId);
        urlObj.searchParams.delete('_rsc');

        pagePath =
          urlObj.pathname +
          (urlObj.searchParams.toString() ? `?${urlObj.searchParams.toString()}` : '');

        const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
        const keys = ['source', 'medium', 'campaign', 'content', 'term'];

        utmParams.forEach((param, index) => {
          const val = urlObj.searchParams.get(param);
          if (val) campaignParams[keys[index]] = val;
        });
      }
    } catch {
      pagePath = typeof contextId === 'string' ? contextId : '/';
    }

    const gaPayload: any = {
      client_id: typeof uid === 'string' && uid ? uid : generateClientId(),
      
      // 3. DÜZELTME: Temizlenmiş IP'yi kök dizine ekleyerek GA4 haritasını besliyoruz
      ...(clientIp && { client_ip: clientIp }),

      user_properties: {
        language: {
          value: typeof language === 'string' ? language : 'unknown',
        },
      },

      events: [
        {
          name: eventName,
          params: {
            ...restParams,
            page_location: typeof contextId === 'string' ? contextId : '',
            page_path: pagePath,
            page_title: typeof viewLabel === 'string' ? viewLabel : '',
            page_referrer: referrer === '$direct' ? '' : referrer || '',
            ga_session_id: Number(sid) || Math.floor(Date.now() / 1000),
            engagement_time_msec: Number(engagement_time_msec) || 100,
            screen_resolution: screenResolution || '',
            browser_language: language || '',
            timezone: timezone || '',
            device_type: deviceType || '',
            viewport: viewport || '',
            ...campaignParams,
            
            country: geo.country || '',
            region: geo.region || '',
            city: geo.city || '',
          },
        },
      ],
    };

    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000);

    const endpoint = DEBUG_GA
      ? `https://www.google-analytics.com/debug/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`
      : `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

    const gaResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userAgent && { 'User-Agent': userAgent }),
      },
      body: JSON.stringify(gaPayload),
      signal: controller.signal,
    });

    if (DEBUG_GA) {
      const debugResult = await gaResponse.text();
      console.log('[GA DEBUG]', debugResult);
    }

    if (!gaResponse.ok) {
      console.error('[Analytics] GA Request Failed:', gaResponse.status, gaResponse.statusText);
      return NextResponse.json({ status: 'ga_error' }, { status: 500 });
    }

    return NextResponse.json(
      {
        status: 'synced',
        geo: { country: geo.country, region: geo.region, city: geo.city },
        ip: clientIp,
        pagePath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Analytics] Sync Error:', error);
    return NextResponse.json({ status: 'idle' }, { status: 200 });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}