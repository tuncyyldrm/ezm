import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page_path, title } = body;

    // 1. Bilgilerini buraya güvenle yaz (Burası sunucu tarafı, tarayıcıda asla görünmez)
    const GA_MEASUREMENT_ID = 'G-JEB7YLM2RV';
    const GA_API_SECRET = 'PANELDEN_ALDIGIN_API_SECRET_BURAYA'; 

    // 2. Google sunucularına giden URL'e api_secret parametresini ekliyoruz
    const googleUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

    // 3. Mevcut cookie'yi kontrol et veya yeni üret
    let clientId = req.cookies.get('ga_client_id')?.value;
    if (!clientId) {
      clientId = crypto.randomUUID();
    }

    const payload = {
      client_id: clientId,
      events: [
        {
          name: 'page_view',
          params: {
            page_title: title || 'Yedek Parça Kataloğu',
            page_location: `${req.nextUrl.origin}${page_path}`,
          },
        },
      ],
    };

    // Sunucudan Google'a güvenli gönderim
    await fetch(googleUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('ga_client_id', clientId, { maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Telemetry failed' }, { status: 500 });
  }
}