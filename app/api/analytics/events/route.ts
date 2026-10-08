import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BOT_PATTERN = /bot|crawler|spider|crawl|preview|fetcher/i;
const EVENT_NAMES = new Set(["page_view", "page_leave", "search"]);
const DEVICE_TYPES = new Set(["mobile", "tablet", "desktop"]);

type AnalyticsInput = {
  eventName?: unknown;
  contextId?: unknown;
  viewLabel?: unknown;
  uid?: unknown;
  sid?: unknown;
  deviceType?: unknown;
  duration_ms?: unknown;
  max_scroll?: unknown;
  term?: unknown;
  result_count?: unknown;
};

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Site analytics require Supabase service-role configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getReferrerHost(value: string | null, siteOrigin: string) {
  if (!value) return "";

  try {
    const referrer = new URL(value);
    return referrer.origin === siteOrigin ? "" : referrer.hostname.slice(0, 120);
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let originIsValid = false;
  try {
    originIsValid = Boolean(origin) && new URL(origin as string).origin === new URL(request.url).origin;
  } catch {
    originIsValid = false;
  }
  if (!originIsValid) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  if (BOT_PATTERN.test(userAgent)) {
    return NextResponse.json({ status: "ignored_bot" }, { status: 202 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) {
    return NextResponse.json({ error: "İstek boyutu sınırı aşıldı." }, { status: 413 });
  }

  let input: AnalyticsInput;
  try {
    const body = await request.text();
    if (body.length > 4096) {
      return NextResponse.json({ error: "İstek boyutu sınırı aşıldı." }, { status: 413 });
    }
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
    }
    input = parsed as AnalyticsInput;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (typeof input.eventName !== "string" || !EVENT_NAMES.has(input.eventName)) {
    return NextResponse.json({ status: "ignored_event" }, { status: 202 });
  }

  if (
    typeof input.contextId !== "string" ||
    typeof input.uid !== "string" ||
    !/^[a-zA-Z0-9-]{8,64}$/.test(input.uid) ||
    typeof input.sid !== "string" ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(input.sid) ||
    typeof input.deviceType !== "string" ||
    !DEVICE_TYPES.has(input.deviceType)
  ) {
    return NextResponse.json({ error: "Analiz olayı geçersiz." }, { status: 400 });
  }

  let page: URL;
  try {
    page = new URL(input.contextId);
    if (page.origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Sayfa adresi geçersiz." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Sayfa adresi geçersiz." }, { status: 400 });
  }

  const path = page.pathname;
  if (
    path.startsWith("/admin") ||
    path.startsWith("/api/") ||
    path === "/login"
  ) {
    return NextResponse.json({ status: "ignored_page" }, { status: 202 });
  }

  const metadata: Record<string, number | string> = {};
  if (input.eventName === "page_leave") {
    if (typeof input.duration_ms === "number" && Number.isFinite(input.duration_ms)) {
      metadata.duration_ms = Math.max(0, Math.min(Math.round(input.duration_ms), 86_400_000));
    }
    if (typeof input.max_scroll === "number" && Number.isFinite(input.max_scroll)) {
      metadata.max_scroll = Math.max(0, Math.min(Math.round(input.max_scroll), 100));
    }
  }
  if (input.eventName === "search" && typeof input.term === "string") {
    const term = input.term.trim().slice(0, 100);
    if (!term) {
      return NextResponse.json({ error: "Arama terimi boş olamaz." }, { status: 400 });
    }
    metadata.term = term;
    if (typeof input.result_count === "number" && Number.isFinite(input.result_count)) {
      metadata.result_count = Math.max(0, Math.min(Math.round(input.result_count), 100_000));
    }
  }

  try {
    const { error } = await getServiceClient().from("site_analytics_events").insert({
      event_name: input.eventName,
      path,
      page_title: typeof input.viewLabel === "string" ? input.viewLabel.trim().slice(0, 160) : "",
      visitor_id: input.uid,
      session_id: input.sid,
      device_type: input.deviceType,
      referrer_host: input.eventName === "page_view"
        ? getReferrerHost(request.headers.get("referer"), new URL(request.url).origin)
        : "",
      metadata,
    });

    if (error) {
      console.error("[Analytics] Olay Supabase'e kaydedilemedi:", error.message);
      return NextResponse.json({ error: "Analiz olayı kaydedilemedi." }, { status: 500 });
    }

    return NextResponse.json({ status: "recorded" }, { status: 202 });
  } catch (error) {
    console.error("[Analytics] Supabase yapılandırma hatası:", error);
    return NextResponse.json({ error: "Analiz hizmeti yapılandırılmamış." }, { status: 500 });
  }
}
