import { NextResponse } from 'next/server';

// Google Analytics GA4 Measurement Protocol Bilgileri
const GA_MEASUREMENT_ID = 'G-JEB7YLM2RV'; // Kendi G- kodun
const GA_API_SECRET = 'YOUR_API_SECRET_FROM_GA_PANEL'; // GA4 > Veri Akışları > Ölçüm Protokolü API gizli anahtarı

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Tarayıcıdan gelen masum değişkenleri alıyoruz
    const { contextId, viewLabel } = body; 

    // Google'ın zorunlu tuttuğu Measurement Protocol gövdesi
    const googlePayload = {
      client_id: 'internal_user_' + Math.random().toString(36).substring(2, 11), // Benzersiz anonim kullanıcı ID
      events: [
        {
          name: 'page_view',
          params: {
            page_location: contextId, // Örn: /product/MYA-FI-002
            page_title: viewLabel,
          },
        },
      ],
    };

    // İstek tamamen sunucu (Server) üzerinden atılıyor. AdBlock asla göremez!
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googlePayload),
      }
    );

    return NextResponse.json({ status: 'synced' }, { status: 200 });
  } catch (error) {
    // Hata olsa bile tarayıcıya çaktırmamak için 200 dönüyoruz
    return NextResponse.json({ status: 'idle' }, { status: 200 });
  }
}