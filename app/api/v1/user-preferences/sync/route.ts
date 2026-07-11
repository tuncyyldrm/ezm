// app/api/v1/user-preferences/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-JEB7YLM2RV';
const GA_API_SECRET = process.env.GA_API_SECRET || 'mC0GamSQR5m2VYLSPc0t5Q';
const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

// Bot pattern'leri
const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'headless', 'selenium', 
  'puppeteer', 'playwright', 'googlebot', 'bingbot',
  'yandexbot', 'whatsapp', 'telegrambot', 'slackbot',
  'discordbot', 'baiduspider', 'facebookexternalhit',
  'prerender', 'preview', 'scan', 'check', 'monitor',
];

// Rate limiting için basit in-memory store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // istek/saniye
const RATE_WINDOW = 1000; // 1 saniye

// IP anonimleştirme (GDPR uyumlu)
function anonymizeIp(ip: string): string {
  if (!ip || ip === '0.0.0.0' || ip === 'unknown') return '0.0.0.0';
  
  if (ip.includes('.')) {
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 3).join(':') + '::0';
  }
  return '0.0.0.0';
}

// Bot kontrolü
function isBot(userAgent: string): boolean {
  if (!userAgent) return true; // Boş user-agent = şüpheli
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

// Session ID oluşturma (daha güvenli)
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
  return `${timestamp}_${random.substring(0, 8)}`;
}

// Rate limiting kontrolü
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Cache temizliği (memory leak önleme)
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}, 60000); // Her dakika temizlik

// Tip tanımlamaları
interface TrackingPayload {
  contextId?: string;
  viewLabel?: string;
  userId?: string;
  sessionRef?: string;
  meta?: {
    action?: string;
    value?: any;
    label?: string;
    category?: string;
  };
  status?: {
    tier?: string;
    since?: number;
    visited?: string[];
  };
  perf?: {
    load?: number;
    paint?: number;
    interact?: number;
    shift?: number;
  };
  items?: Array<{
    item_id?: string;
    item_name?: string;
    price?: number;
    quantity?: number;
    [key: string]: any;
  }>;
}

// Ana POST handler
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    // 1. Headers'dan bilgileri güvenli şekilde al
    const userAgent = request.headers.get('user-agent') || '';
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                  request.headers.get('x-real-ip') ||
                  request.headers.get('cf-connecting-ip') || // Cloudflare
                  '0.0.0.0';
    const ip = anonymizeIp(rawIp);
    const referer = request.headers.get('referer') || '';
    const acceptLanguage = request.headers.get('accept-language') || 'tr';
    const origin = request.headers.get('origin') || '';
    
    // 2. Rate limiting kontrolü
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { status: 'throttled' },
        { 
          status: 200,
          headers: { 'X-RateLimit-Remaining': '0' }
        }
      );
    }
    
    // 3. Bot kontrolü
    if (isBot(userAgent)) {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    
    // 4. Body parse (güvenli)
    let body: TrackingPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ status: 'invalid' }, { status: 200 });
    }
    
    // 5. Veri doğrulama
    const pageLocation = (body.contextId || referer || '/unknown')
      .substring(0, 500); // Maksimum uzunluk sınırı
    const pageTitle = (body.viewLabel || 'Untitled')
      .substring(0, 300);
    
    // 6. Client ID yönetimi
    const clientId = (body.userId || `usr_${ip}_${Date.now().toString(36)}`)
      .substring(0, 100);
    
    // 7. Session ID yönetimi
    const sessionId = (body.sessionRef || generateSessionId())
      .substring(0, 100);
    
    // 8. Event'leri oluştur
    const events: any[] = [];
    const timestamp = Date.now();
    
    // Ana page_view event'i (GA4 için zorunlu)
    events.push({
      name: 'page_view',
      params: {
        page_location: pageLocation,
        page_title: pageTitle,
        page_referrer: referer.substring(0, 500),
        engagement_time_msec: '100',
        session_id: sessionId,
        language: acceptLanguage.split(',')[0]?.substring(0, 10) || 'tr',
        page_load_time: body.perf?.load || 0,
        first_contentful_paint: body.perf?.paint || 0,
        cumulative_layout_shift: body.perf?.shift || 0,
        first_input_delay: body.perf?.interact || 0,
        user_type: body.status?.tier || 'visitor',
      },
    });
    
    // Özel event
    if (body.meta?.action) {
      const customEvent: any = {
        name: body.meta.action.substring(0, 40).replace(/[^a-zA-Z0-9_]/g, '_'),
        params: {
          session_id: sessionId,
          engagement_time_msec: '100',
          page_location: pageLocation,
          event_category: (body.meta.category || 'general').substring(0, 150),
          event_label: (body.meta.label || '').substring(0, 500),
        },
      };
      
      // Value parametresi (sadece sayısal değer)
      if (typeof body.meta.value === 'number' && !isNaN(body.meta.value)) {
        customEvent.params.value = body.meta.value;
      }
      
      // Ek parametreler (obje ise)
      if (typeof body.meta.value === 'object' && body.meta.value !== null) {
        Object.entries(body.meta.value).forEach(([key, val]) => {
          if (typeof val === 'string' || typeof val === 'number') {
            customEvent.params[key] = String(val).substring(0, 100);
          }
        });
      }
      
      events.push(customEvent);
    }
    
    // E-ticaret event'i
    if (body.items?.length && body.items.length > 0) {
      events.push({
        name: body.meta?.action?.includes('purchase') ? 'purchase' : 'view_item_list',
        params: {
          currency: 'TRY',
          session_id: sessionId,
          engagement_time_msec: '100',
          page_location: pageLocation,
          items: body.items.slice(0, 10).map(item => ({
            item_id: String(item.item_id || '').substring(0, 100),
            item_name: String(item.item_name || '').substring(0, 200),
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
          })),
        },
      });
    }
    
    // user_engagement event'i (GA4 oturum analizi için kritik)
    events.push({
      name: 'user_engagement',
      params: {
        session_id: sessionId,
        engagement_time_msec: '100',
        page_location: pageLocation,
      },
    });
    
    // 9. GA4 payload'unu hazırla
    const gaPayload = {
      client_id: clientId,
      timestamp_micros: timestamp * 1000,
      user_properties: body.status?.tier ? {
        user_tier: { value: String(body.status.tier).substring(0, 36) },
        registration_date: { value: body.status.since || 0 },
      } : undefined,
      events,
      consent: {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    };
    
    // 10. Google Analytics'e gönder
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 saniye timeout
    
    try {
      const gaResponse = await fetch(
        `${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; EzmotoAnalytics/1.0)',
          },
          body: JSON.stringify(gaPayload),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      // GA4 yanıtını kontrol et (opsiyonel)
      if (process.env.NODE_ENV === 'development') {
        const responseText = await gaResponse.text();
        console.log('📊 GA4 Response:', {
          status: gaResponse.status,
          page: pageLocation,
          events: events.map(e => e.name),
          duration: `${Math.round(performance.now() - startTime)}ms`,
        });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (process.env.NODE_ENV === 'development') {
        console.error('📊 GA4 Network Error:', fetchError);
      }
    }
    
    // 11. Başarılı yanıt
    return NextResponse.json(
      { 
        status: 'synced',
        ref: sessionId,
        ts: timestamp,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
          'X-Content-Type-Options': 'nosniff',
          'X-Robots-Tag': 'noindex, nofollow',
          'Server-Timing': `analytics;dur=${Math.round(performance.now() - startTime)}`,
        },
      }
    );
    
  } catch (error) {
    // Genel hata yakalama
    if (process.env.NODE_ENV === 'development') {
      console.error('📊 Analytics Error:', error);
    }
    
    return NextResponse.json(
      { status: 'idle' },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// OPTIONS handler (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      },
    }
  );
}

// Edge Runtime'ı belirt (opsiyonel, daha hızlı)
export const runtime = 'edge';