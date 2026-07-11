import { NextResponse } from 'next/server';

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
const GA_API_SECRET = process.env.GA_API_SECRET;

const BOT_REGEX =
  /bot|crawler|spider|crawl|GPTBot|ClaudeBot|AhrefsBot|SemrushBot|YandexBot|bingbot|Googlebot/i;

const MAX_EVENT_NAME_LENGTH = 40;

export async function POST(request: Request) {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
      console.error('[Analytics] Missing GA configuration');

      return NextResponse.json(
        {
          status: 'analytics_disabled',
        },
        {
          status: 500,
        }
      );
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
      ...restParams
    } = body || {};

    if (
      typeof eventName !== 'string' ||
      !eventName.trim() ||
      eventName.length > MAX_EVENT_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          status: 'invalid_event_name',
        },
        {
          status: 400,
        }
      );
    }

    const userAgent =
      request.headers.get('user-agent') || '';

    if (BOT_REGEX.test(userAgent)) {
      return NextResponse.json(
        {
          status: 'ignored_bot',
        },
        {
          status: 200,
        }
      );
    }

    const clientIp =
      request.headers
        .get('x-forwarded-for')
        ?.split(',')[0]
        ?.trim() ||
      request.headers.get('x-real-ip') ||
      '';

    // Vercel Geo Headers
    const country =
      request.headers.get('x-vercel-ip-country') ||
      '';

    const region =
      request.headers.get(
        'x-vercel-ip-country-region'
      ) || '';

    const city =
      request.headers.get('x-vercel-ip-city') ||
      '';

    let pagePath = '/';

    const campaignParams: Record<string, string> =
      {};

    try {
      if (
        typeof contextId === 'string' &&
        contextId
      ) {
        const urlObj = new URL(contextId);

        pagePath =
          urlObj.pathname + urlObj.search;

        const utmSource =
          urlObj.searchParams.get(
            'utm_source'
          );

        const utmMedium =
          urlObj.searchParams.get(
            'utm_medium'
          );

        const utmCampaign =
          urlObj.searchParams.get(
            'utm_campaign'
          );

        const utmContent =
          urlObj.searchParams.get(
            'utm_content'
          );

        const utmTerm =
          urlObj.searchParams.get(
            'utm_term'
          );

        if (utmSource)
          campaignParams.source =
            utmSource;

        if (utmMedium)
          campaignParams.medium =
            utmMedium;

        if (utmCampaign)
          campaignParams.campaign =
            utmCampaign;

        if (utmContent)
          campaignParams.content =
            utmContent;

        if (utmTerm)
          campaignParams.term =
            utmTerm;
      }
    } catch {
      pagePath =
        typeof contextId === 'string'
          ? contextId
          : '/';
    }

    const gaPayload = {
      client_id:
        typeof uid === 'string' && uid
          ? uid
          : crypto.randomUUID(),

      user_properties: {
        language: {
          value:
            typeof language === 'string'
              ? language
              : 'unknown',
        },

        country: {
          value: country,
        },

        region: {
          value: region,
        },

        city: {
          value: city,
        },
      },

      events: [
        {
          name: eventName,

          params: {
            page_location:
              typeof contextId === 'string'
                ? contextId
                : '',

            page_path: pagePath,

            page_title:
              typeof viewLabel === 'string'
                ? viewLabel
                : '',

            page_referrer:
              referrer === '$direct'
                ? ''
                : referrer || '',

            ga_session_id:
              Number(sid) ||
              Math.floor(Date.now() / 1000),

            engagement_time_msec:
              Number(
                restParams.engagement_time_msec
              ) || 100,

            screen_resolution:
              screenResolution || '',

            browser_language:
              language || '',

            timezone:
              timezone || '',

            country,
            region,
            city,

            ...campaignParams,
            ...restParams,
          },
        },
      ],
    };

    const controller =
      new AbortController();

    timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000);

    const gaResponse = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',

          ...(userAgent && {
            'User-Agent':
              userAgent,
          }),

          ...(clientIp && {
            'X-Forwarded-For':
              clientIp,
          }),
        },
        body: JSON.stringify(
          gaPayload
        ),
        signal: controller.signal,
      }
    );

    if (!gaResponse.ok) {
      console.error(
        '[Analytics] GA Request Failed:',
        gaResponse.status,
        gaResponse.statusText
      );

      return NextResponse.json(
        {
          status: 'ga_error',
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        status: 'synced',

        geo: {
          country,
          region,
          city,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      '[Analytics] Sync Error:',
      error
    );

    return NextResponse.json(
      {
        status: 'idle',
      },
      {
        status: 200,
      }
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}