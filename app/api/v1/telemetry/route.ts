import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page_path, title } = body;

    // Google Analytics v4 Ölçüm Protokolü (Measurement Protocol) URL'i
    // Bu URL sunucular arası çalıştığı için AdBlocker burayı göremez bile.
    const GA_MEASUREMENT_ID = 'G-JEB7YLM2RV';
    
    // API Secret oluşturmadıysan sadece Measurement ID ile de basit verileri gönderebilirsin
    const googleUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}`;

    // Rastgele veya kullanıcıya özel benzersiz bir Client ID üretelim (GA için zorunludur)
    const clientId = req.cookies.get('ga_client_id')?.value || crypto.randomUUID();

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

    // Google Sunucularına el sıkışarak veriyi gönderiyoruz
    await fetch(googleUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = NextResponse.json({ success: true });
    
    // Kullanıcıyı takip edebilmek için client_id'yi cookie olarak saklayalım
    response.cookies.set('ga_client_id', clientId, { maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Telemetry failed' }, { status: 500 });
  }
}