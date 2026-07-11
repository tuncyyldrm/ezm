import { NextResponse } from 'next/server';

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-JEB7YLM2RV';
const GA_API_SECRET = process.env.GA_API_SECRET || 'mC0GamSQR5m2VYLSPc0t5Q';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, contextId, viewLabel, uid, sid, screenResolution, language, referrer, ...restParams } = body;

    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const clientIp = forwardedFor.split(',')[0].trim();

    // 1. Temiz Sayfa Yolu (Path) Ayıklama Mekanizması
    let pagePath = '/';
    let campaignParams: Record<string, string> = {};

    try {
      const urlObj = new URL(contextId);
      pagePath = urlObj.pathname + urlObj.search;

      // 2. GA4 Measurement Protocol Resmi Kampanya Parametreleri
      const utmSource = urlObj.searchParams.get('utm_source');
      const utmMedium = urlObj.searchParams.get('utm_medium');
      const utmCampaign = urlObj.searchParams.get('utm_campaign');
      
      if (utmSource) campaignParams['source'] = utmSource;
      if (utmMedium) campaignParams['medium'] = utmMedium;
      if (utmCampaign) campaignParams['campaign'] = utmCampaign;
    } catch (e) {
      pagePath = contextId; // URL parse edilemezse fallback
    }

    const googlePayload = {
      client_id: uid,
      events: [
        {
          name: eventName,
          params: {
            page_location: contextId,
            page_path: pagePath,
            page_title: viewLabel,
            page_referrer: referrer === '$direct' ? '' : referrer,
            ga_session_id: sid,
            engagement_time_msec: 100,
            custom_language: language,
            screen_resolution: screenResolution,
            ...campaignParams,  // Düzeltilmiş trafik kaynakları
            ...restParams       // E-ticaret veya diğer özel parametreler
          },
        },
      ],
    };

    // Google Analytics API İsteği
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'X-Forwarded-For': clientIp,
        },
        body: JSON.stringify(googlePayload),
      }
    );

    return NextResponse.json({ status: 'synced' }, { status: 200 });
  } catch (error) {
    console.error('GA Sync Error:', error);
    return NextResponse.json({ status: 'idle' }, { status: 200 });
  }
}