import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type VercelAnalyticsRow = Record<string, unknown>;

function getMetric(row: VercelAnalyticsRow) {
  const metric = row.pageviews ?? row.visits ?? row.count;
  return typeof metric === "number" && Number.isFinite(metric) ? metric : 0;
}

async function queryVercelAnalytics(
  token: string,
  projectId: string,
  teamId: string | undefined,
  since: string,
  until: string,
  by: string[] = [],
) {
  const params = new URLSearchParams({
    projectId,
    since,
    until,
    by: by.join(","),
  });
  if (by.includes("requestPath")) params.set("limit", "10");
  if (teamId) params.set("teamId", teamId);

  const response = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("[Analytics] Vercel API isteği başarısız:", response.status, detail);
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Vercel API token yetkisiz. Token erişimini kontrol edin."
        : response.status === 404
          ? "Vercel proje kimliği bulunamadı veya Analytics etkin değil."
          : "Vercel Analytics verileri alınamadı.",
    );
  }

  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("data" in result)) {
    throw new Error("Vercel Analytics beklenmeyen bir yanıt döndürdü.");
  }
  return (result as { data: unknown }).data;
}

async function queryVercelTotals(
  token: string,
  projectId: string,
  teamId: string | undefined,
  since: string,
  until: string,
) {
  const params = new URLSearchParams({ projectId, since, until });
  if (teamId) params.set("teamId", teamId);

  const response = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/visits/count?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("[Analytics] Vercel API isteği başarısız:", response.status, detail);
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Vercel API token yetkisiz. Token erişimini kontrol edin."
        : response.status === 404
          ? "Vercel proje kimliği bulunamadı veya Analytics etkin değil."
          : "Vercel Analytics verileri alınamadı.",
    );
  }

  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("data" in result)) {
    throw new Error("Vercel Analytics beklenmeyen bir yanıt döndürdü.");
  }
  const data = (result as { data: unknown }).data;
  return data && typeof data === "object" && !Array.isArray(data)
    ? data as VercelAnalyticsRow
    : {};
}

function getRows(data: unknown): VercelAnalyticsRow[] {
  if (Array.isArray(data)) {
    return data.filter((row): row is VercelAnalyticsRow => Boolean(row) && typeof row === "object");
  }
  return data && typeof data === "object" ? [data as VercelAnalyticsRow] : [];
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("[Analytics] Supabase oturum yapılandırması eksik.");
    return NextResponse.json({ error: "Admin oturumu doğrulanamadı." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
  const { data: auth, error: authError } = await authClient.auth.getUser();

  if (authError) {
    console.error("[Analytics] Admin oturumu doğrulanamadı:", authError.message);
    return NextResponse.json({ error: "Oturum doğrulanamadı." }, { status: 401 });
  }
  if (auth.user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Bu işlem için admin yetkisi gerekir." }, { status: 403 });
  }

  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return NextResponse.json(
      { error: "VERCEL_ANALYTICS_TOKEN ve VERCEL_PROJECT_ID ortam değişkenlerini tanımlayın." },
      { status: 503 },
    );
  }

  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam === "30" || daysParam === "90" ? Number(daysParam) : 7;
  const untilDate = new Date();
  const sinceDate = new Date(untilDate);
  sinceDate.setUTCDate(sinceDate.getUTCDate() - days);
  const since = sinceDate.toISOString();
  const until = untilDate.toISOString();

  try {
    const teamId = process.env.VERCEL_TEAM_ID || undefined;
    const [dailyData, pagesData, totals] = await Promise.all([
      queryVercelAnalytics(token, projectId, teamId, since, until, ["day"]),
      queryVercelAnalytics(token, projectId, teamId, since, until, ["requestPath"]),
      queryVercelTotals(token, projectId, teamId, since, until),
    ]);

    const daily = getRows(dailyData).map((row) => ({
      date: typeof row.timestamp === "string" ? row.timestamp.slice(0, 10) : "",
      views: getMetric(row),
    }));
    const pages = getRows(pagesData)
      .map((row) => ({
        path: typeof row.requestPath === "string" ? row.requestPath : "/",
        views: getMetric(row),
      }))
      .sort((a, b) => b.views - a.views);
    return NextResponse.json(
      {
        days,
        totals: {
          views: Number(totals.pageviews) || 0,
          visitors: Number(totals.visitors) || 0,
        },
        daily,
        pages,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[Analytics] Vercel Analytics raporu alınamadı:", error);
    const message = error instanceof Error ? error.message : "Vercel Analytics raporu alınamadı.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
