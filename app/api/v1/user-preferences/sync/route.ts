// app/api/v1/user-preferences/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-JEB7YLM2RV';
const GA_API_SECRET = process.env.GA_API_SECRET || 'mC0GamSQR5m2VYLSPc0t5Q';
const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

// Basit session ID oluşturma (Edge uyumlu)
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// IP anonimleştirme
function anonymizeIp(ip: string): string {
  if (!ip || ip === 'unknown') return '0.0.0.0';
  if (ip.includes('.')) {
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }
  return '0.0.0.0';
}

export async function POST(request: NextRequest) {
  try {
    // Headers'dan bilgileri al
    const userAgent = request.headers.get('user-agent') || '';
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                  request.headers.get('x-real-ip') ||
                  '0.0.0.0';
    const ip = anonymizeIp(rawIp);
    const referer = request.headers.get('referer') || '';
    const language = request.headers.get('accept-language') || 'tr';
    
    // Body parse
    let body: any;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    
    // Verileri hazırla
    const pageLocation = (body.contextId || referer || '/unknown').substring(0, 500);
    const pageTitle = (body.viewLabel || 'Untitled').substring(0, 300);
    const clientId = (body.userId || `usr_${generateId()}`).substring(0, 100);
    const sessionId = (body.sessionRef || generateId()).substring(0, 100);
    
    // GA4 event'leri
    const events: any[] = [];
    const timestamp = Date.now();
    
    // Page view event'i
    events.push({
      name: 'page_view',
      params: {
        page_location: pageLocation,
        page_title: pageTitle,
        page_referrer: referer.substring(0, 500),
        engagement_time_msec: '100',
        session_id: sessionId,
        language: language.split(',')[0]?.substring(0, 10) || 'tr',
        user_type: body.status?.tier || 'visitor',
      },
    });
    
    // Özel event varsa
    if (body.meta?.action) {
      events.push({
        name: body.meta.action.substring(0, 40).replace(/[^a-zA-Z0-9_]/g, '_'),
        params: {
          session_id: sessionId,
          engagement_time_msec: '100',
          page_location: pageLocation,
          event_category: (body.meta.category || 'general').substring(0, 150),
          event_label: (body.meta.label || '').substring(0, 500),
        },
      });
    }
    
    // User engagement event'i
    events.push({
      name: 'user_engagement',
      params: {
        session_id: sessionId,
        engagement_time_msec: '100',
        page_location: pageLocation,
      },
    });
    
    // GA4 payload'u
    const gaPayload = {
      client_id: clientId,
      timestamp_micros: timestamp * 1000,
      events,
      consent: {
        analytics_storage: 'granted',
        ad_storage: 'denied',
      },
    };
    
    // Google Analytics'e gönder
    try {
      await fetch(
        `${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gaPayload),
          // Edge Runtime'da signal desteklenmeyebilir
        }
      );
    } catch (fetchError) {
      console.error('GA4 send error:', fetchError);
    }
    
    return NextResponse.json(
      { status: 'synced' },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { status: 'idle' },
      { status: 200 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ❌ BU SATIRI SİLİN VEYA YORUM SATIRI YAPIN
// export const runtime = 'edge';