import { GoogleAuth } from "google-auth-library";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/site";

export const runtime = "nodejs";

type AnalyticsRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type AnalyticsReport = {
  rows?: AnalyticsRow[];
  totals?: AnalyticsRow[];
};

function metricValue(row: AnalyticsRow | undefined, index: number) {
  const value = Number(row?.metricValues?.[index]?.value);
  return Number.isFinite(value) ? value : 0;
}

function parseCalendarDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp;
}

function formatCalendarDate(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<AnalyticsReport> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("[Analytics] GA4 Data API isteği başarısız:", response.status, detail);
    throw new Error(
      response.status === 403
        ? "GA4 Data API erişimi yok. API'yi etkinleştirip servis hesabına mülk Görüntüleyen yetkisi verin."
        : response.status === 404
          ? "GA4 mülk kimliği bulunamadı."
          : "GA4 raporu alınamadı.",
    );
  }

  const result: unknown = await response.json();
  if (!result || typeof result !== "object") {
    throw new Error("GA4 beklenmeyen bir yanıt döndürdü.");
  }
  return result as AnalyticsReport;
}

async function runRealtimeReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<AnalyticsReport> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("[Analytics] GA4 gerçek zamanlı API isteği başarısız:", response.status, detail);
    throw new Error(
      response.status === 403
        ? "GA4 gerçek zamanlı raporuna erişilemiyor. API'yi ve servis hesabı yetkilerini kontrol edin."
        : "GA4 gerçek zamanlı verileri alınamadı.",
    );
  }

  const result: unknown = await response.json();
  if (!result || typeof result !== "object") {
    throw new Error("GA4 gerçek zamanlı API beklenmeyen bir yanıt döndürdü.");
  }
  return result as AnalyticsReport;
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

  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GA_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!propertyId || !clientEmail || !privateKey) {
    return NextResponse.json(
      {
        error:
          "GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_EMAIL ve GA_SERVICE_ACCOUNT_PRIVATE_KEY ortam değişkenlerini tanımlayın.",
      },
      { status: 503 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const daysParam = searchParams.get("days");
  const isToday = searchParams.get("period") === "today";
  const isYesterday = searchParams.get("period") === "yesterday";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const isCustomRange = startDateParam !== null || endDateParam !== null;
  let days = isToday || isYesterday ? 1 : daysParam === "30" ? 30 : 7;
  let startDate: string;
  let endDate: string;
  let previousStartDate: string;
  let previousEndDate: string;

  if (isCustomRange) {
    const startTimestamp = parseCalendarDate(startDateParam);
    const endTimestamp = parseCalendarDate(endDateParam);
    if (startTimestamp === null || endTimestamp === null || startTimestamp > endTimestamp) {
      return NextResponse.json(
        { error: "Başlangıç ve bitiş tarihlerini geçerli biçimde seçin; başlangıç bitişten sonra olamaz." },
        { status: 400 },
      );
    }
    const rangeDays = Math.floor((endTimestamp - startTimestamp) / 86_400_000) + 1;
    if (rangeDays > 366) {
      return NextResponse.json(
        { error: "Özel rapor aralığı en fazla 366 gün olabilir." },
        { status: 400 },
      );
    }
    days = rangeDays;
    startDate = formatCalendarDate(startTimestamp);
    endDate = formatCalendarDate(endTimestamp);
    previousStartDate = formatCalendarDate(startTimestamp - rangeDays * 86_400_000);
    previousEndDate = formatCalendarDate(startTimestamp - 86_400_000);
  } else if (isToday) {
    startDate = "today";
    endDate = "today";
    previousStartDate = "yesterday";
    previousEndDate = "yesterday";
  } else if (isYesterday) {
    startDate = "yesterday";
    endDate = "yesterday";
    previousStartDate = "2daysAgo";
    previousEndDate = "2daysAgo";
  } else {
    startDate = `${days - 1}daysAgo`;
    endDate = "today";
    previousStartDate = `${days * 2 - 1}daysAgo`;
    previousEndDate = `${days}daysAgo`;
  }

  try {
    const hostname = (
      process.env.GA_HOSTNAME || new URL(getBaseUrl()).hostname
    ).trim().toLowerCase();
    const isLiveView = searchParams.get("view") === "live";
    if (
      isLiveView &&
      (process.env.GA_REALTIME_ENABLED !== "true" || process.env.GA_REALTIME_PUBLIC_ONLY !== "true")
    ) {
      return NextResponse.json(
        {
          error:
            "Canlı rapor, yalnızca EZM OTO'ya özel GA4 mülkü ve admin trafiği filtresi doğrulandıktan sonra açılmalıdır.",
        },
        { status: 503 },
      );
    }

    const googleAuth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    const accessToken = await googleAuth.getAccessToken();
    if (!accessToken) throw new Error("Google erişim anahtarı alınamadı.");

    if (isLiveView) {
      const [liveTotals, livePages] = await Promise.all([
        runRealtimeReport(accessToken, propertyId, {
          metrics: [{ name: "activeUsers" }],
        }),
        runRealtimeReport(accessToken, propertyId, {
          metrics: [{ name: "activeUsers" }],
          dimensions: [{ name: "unifiedScreenName" }],
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          limit: 10,
        }),
      ]);
      return NextResponse.json(
        {
          activeUsers: metricValue(liveTotals.rows?.[0], 0),
          pages: (livePages.rows ?? []).map((row) => ({
            title: row.dimensionValues?.[0]?.value || "Başlıksız sayfa",
            users: metricValue(row, 0),
          })),
          updatedAt: new Date().toISOString(),
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const dateRanges = [{ startDate, endDate }];
    const previousDateRanges = [{ startDate: previousStartDate, endDate: previousEndDate }];
    const summaryMetrics = [
      { name: "screenPageViews" },
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "engagementRate" },
    ];
    const hostFilter = {
      filter: {
        fieldName: "hostName",
        stringFilter: { matchType: "EXACT", value: hostname },
      },
    };
    const adminPathFilter = {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: "pagePath",
              stringFilter: { matchType: "EXACT", value: "/admin" },
            },
          },
          {
            filter: {
              fieldName: "pagePath",
              stringFilter: { matchType: "BEGINS_WITH", value: "/admin/" },
            },
          },
        ],
      },
    };
    const publicSiteFilter = {
      andGroup: {
        expressions: [
          hostFilter,
          { notExpression: adminPathFilter },
        ],
      },
    };
    const common = { dateRanges, dimensionFilter: publicSiteFilter, metrics: [{ name: "screenPageViews" }] };
    const [dailyReport, summaryReport, previousSummaryReport, pagesReport, devicesReport, countriesReport, sourcesReport, browsersReport, eventsReport] =
      await Promise.all([
        runReport(accessToken, propertyId, {
          dateRanges,
          dimensionFilter: publicSiteFilter,
          dimensions: [{ name: "date" }],
          metrics: summaryMetrics,
          orderBys: [{ dimension: { dimensionName: "date" } }],
          limit: 250_000,
        }),
        runReport(accessToken, propertyId, {
          dateRanges,
          dimensionFilter: publicSiteFilter,
          metrics: summaryMetrics,
          metricAggregations: ["TOTAL"],
        }),
        runReport(accessToken, propertyId, {
          dateRanges: previousDateRanges,
          dimensionFilter: publicSiteFilter,
          metrics: summaryMetrics,
          metricAggregations: ["TOTAL"],
        }),
        runReport(accessToken, propertyId, {
          dateRanges,
          dimensionFilter: publicSiteFilter,
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "sessions" },
          ],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 250_000,
        }),
        ...[
          ["deviceCategory", "devices"],
          ["country", "countries"],
          ["sessionSource", "sources"],
          ["browser", "browsers"],
        ].map(async ([dimension]) =>
          runReport(accessToken, propertyId, {
            ...common,
            dimensions: [{ name: dimension }],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 10,
          }),
        ),
        runReport(accessToken, propertyId, {
          ...common,
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 10,
        }),
      ]);

    const getBreakdown = (report: AnalyticsReport) =>
      (report.rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || "Bilinmiyor",
        views: metricValue(row, 0),
      }));
    const totals = summaryReport.totals?.[0];
    const previousTotals = previousSummaryReport.totals?.[0];

    return NextResponse.json(
      {
        days,
        startDate,
        endDate,
        totals: {
          views: metricValue(totals, 0),
          visitors: metricValue(totals, 1),
          sessions: metricValue(totals, 2),
          engagementRate: metricValue(totals, 3),
        },
        previousTotals: {
          views: metricValue(previousTotals, 0),
          visitors: metricValue(previousTotals, 1),
          sessions: metricValue(previousTotals, 2),
          engagementRate: metricValue(previousTotals, 3),
        },
        daily: (dailyReport.rows ?? []).map((row) => {
          const rawDate = row.dimensionValues?.[0]?.value ?? "";
          return {
            date: rawDate.length === 8
              ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
              : rawDate,
            views: metricValue(row, 0),
            users: metricValue(row, 1),
            sessions: metricValue(row, 2),
          };
        }),
        pages: (pagesReport.rows ?? []).map((row) => ({
          path: row.dimensionValues?.[0]?.value || "/",
          views: metricValue(row, 0),
          users: metricValue(row, 1),
          sessions: metricValue(row, 2),
        })),
        products: (pagesReport.rows ?? [])
          .filter((row) => (row.dimensionValues?.[0]?.value ?? "").startsWith("/product/"))
          .map((row) => ({
            path: row.dimensionValues?.[0]?.value || "/",
            title: row.dimensionValues?.[1]?.value || row.dimensionValues?.[0]?.value || "Ürün",
            views: metricValue(row, 0),
            users: metricValue(row, 1),
            sessions: metricValue(row, 2),
          })),
        devices: getBreakdown(devicesReport),
        countries: getBreakdown(countriesReport),
        referrers: getBreakdown(sourcesReport),
        browsers: getBreakdown(browsersReport),
        events: (eventsReport.rows ?? []).map((row) => ({
          name: row.dimensionValues?.[0]?.value || "Bilinmeyen etkinlik",
          count: metricValue(row, 0),
        })),
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[Analytics] GA4 raporu alınamadı:", error);
    const message = error instanceof Error ? error.message : "GA4 raporu alınamadı.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
