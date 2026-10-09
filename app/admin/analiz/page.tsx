"use client";

import { useEffect, useState } from "react";

type MetricTotals = {
  views: number;
  visitors: number;
  sessions: number;
  engagementRate: number;
};

type Report = {
  days: number;
  startDate: string;
  endDate: string;
  totals: MetricTotals;
  previousTotals: MetricTotals;
  daily: Array<{ date: string; views: number; users: number; sessions: number }>;
  pages: Array<{ path: string; views: number; users: number; sessions: number }>;
  products: Array<{ path: string; title: string; views: number; users: number; sessions: number }>;
  devices: Array<{ name: string; views: number }>;
  countries: Array<{ name: string; views: number }>;
  referrers: Array<{ name: string; views: number }>;
  browsers: Array<{ name: string; views: number }>;
  events: Array<{ name: string; count: number }>;
  updatedAt: string;
};

type LiveReport = {
  activeUsers: number;
  pages: Array<{ title: string; users: number }>;
  updatedAt: string;
};

type DateRangeSelection =
  | { type: "preset"; value: "today" | "yesterday" | "7" | "30" }
  | { type: "custom"; startDate: string; endDate: string };

const numberFormat = new Intl.NumberFormat("tr-TR");
const percentFormat = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
function getLocalDateValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const eventLabels: Record<string, string> = {
  page_view: "Sayfa görüntüleme",
  session_start: "Oturum başlangıcı",
  first_visit: "İlk ziyaret",
  user_engagement: "Kullanıcı etkileşimi",
  scroll: "Sayfa kaydırma",
  click: "Bağlantı tıklaması",
  search: "Site içi arama",
  form_start: "Form başlangıcı",
  form_submit: "Form gönderimi",
  purchase: "Satın alma",
  add_to_cart: "Sepete ekleme",
};

function getChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function ChangeLabel({ current, previous }: { current: number; previous: number }) {
  const change = getChange(current, previous);
  if (change === null) {
    return <span className="text-xs text-slate-400">Önceki dönemde veri yok</span>;
  }

  const isIncrease = change > 0;
  const isSame = change === 0;
  return (
    <span className={`text-xs font-semibold ${isSame ? "text-slate-500" : isIncrease ? "text-emerald-700" : "text-rose-700"}`}>
      {isSame ? "—" : isIncrease ? "↑" : "↓"} {percentFormat.format(Math.abs(change) / 100)}
      <span className="ml-1 font-normal text-slate-400">önceki döneme göre</span>
    </span>
  );
}

function BreakdownCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ name: string; views: number }>;
  emptyText: string;
}) {
  const maxViews = Math.max(...items.map((item) => item.views), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-slate-800">{title}</h2>
      {items.length ? (
        <ol className="space-y-4">
          {items.map((item) => (
            <li key={item.name}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-slate-600">{item.name}</span>
                <span className="shrink-0 font-semibold text-slate-900">{numberFormat.format(item.views)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-[width]"
                  style={{ width: `${item.views ? Math.max(3, (item.views / maxViews) * 100) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-6 text-center text-xs text-slate-400">{emptyText}</p>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeSelection>({ type: "preset", value: "7" });
  const [draftStartDate, setDraftStartDate] = useState(() => getLocalDateValue());
  const [draftEndDate, setDraftEndDate] = useState(() => getLocalDateValue());
  const [productSearch, setProductSearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [productSortField, setProductSortField] = useState<"views" | "users" | "sessions">("views");
  const [productSortOrder, setProductSortOrder] = useState<"asc" | "desc">("desc");
  const [productLimit, setProductLimit] = useState(10);

  const [pageSortField, setPageSortField] = useState<"views" | "users">("views");
  const [pageSortOrder, setPageSortOrder] = useState<"asc" | "desc">("desc");
  const [pageLimit, setPageLimit] = useState(10);
  const rangeKey = dateRange.type === "custom"
    ? `custom:${dateRange.startDate}:${dateRange.endDate}`
    : `preset:${dateRange.value}`;
  const query = dateRange.type === "custom"
    ? `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    : dateRange.value === "today"
      ? "period=today"
      : dateRange.value === "yesterday"
        ? "period=yesterday"
        : `days=${dateRange.value}`;
  const chartDays = dateRange.type === "custom"
    ? Math.floor((Date.parse(`${dateRange.endDate}T00:00:00Z`) - Date.parse(`${dateRange.startDate}T00:00:00Z`)) / 86_400_000) + 1
    : dateRange.value === "today" || dateRange.value === "yesterday" ? 1 : Number(dateRange.value);
  const customRangeDays = Math.floor((Date.parse(`${draftEndDate}T00:00:00Z`) - Date.parse(`${draftStartDate}T00:00:00Z`)) / 86_400_000) + 1;
  const today = getLocalDateValue();
  const [result, setResult] = useState<{ rangeKey: string; refreshKey: number; report?: Report; error?: string } | null>(null);
  const [liveResult, setLiveResult] = useState<{ report?: LiveReport; error?: string } | null>(null);
  const loading = result?.rangeKey !== rangeKey || result?.refreshKey !== refreshKey;
  const report = result?.rangeKey === rangeKey && result.refreshKey === refreshKey ? result.report ?? null : null;
  const error = result?.rangeKey === rangeKey && result.refreshKey === refreshKey ? result.error ?? "" : "";
  const daily = report?.daily ?? [];
  const maxViews = Math.max(...daily.map((item) => item.views), 1);
  const normalizedProductSearch = productSearch.trim().toLocaleLowerCase("tr-TR");
  const filteredProducts = (report?.products ?? []).filter((product) =>
    !normalizedProductSearch ||
    product.title.toLocaleLowerCase("tr-TR").includes(normalizedProductSearch) ||
    product.path.toLocaleLowerCase("tr-TR").includes(normalizedProductSearch),
  );
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const valA = a[productSortField];
    const valB = b[productSortField];
    return productSortOrder === "asc" ? valA - valB : valB - valA;
  });
  const displayedProducts = sortedProducts.slice(0, productLimit);

  const normalizedPageSearch = pageSearch.trim().toLocaleLowerCase("tr-TR");
  const filteredPages = (report?.pages ?? []).filter((page) =>
    !normalizedPageSearch || page.path.toLocaleLowerCase("tr-TR").includes(normalizedPageSearch),
  );
  const sortedPages = [...filteredPages].sort((a, b) => {
    const valA = a[pageSortField];
    const valB = b[pageSortField];
    return pageSortOrder === "asc" ? valA - valB : valB - valA;
  });
  const displayedPages = sortedPages.slice(0, pageLimit);

  const handleProductSort = (field: "views" | "users" | "sessions") => {
    if (productSortField === field) {
      setProductSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setProductSortField(field);
      setProductSortOrder("desc");
    }
  };

  const handlePageSort = (field: "views" | "users") => {
    if (pageSortField === field) {
      setPageSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setPageSortField(field);
      setPageSortOrder("desc");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/ga-analytics?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Analiz verisi alınamadı.";
          throw new Error(message);
        }
        setResult({ rangeKey, refreshKey, report: body as Report });
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setResult({
          rangeKey,
          refreshKey,
          error: fetchError instanceof Error ? fetchError.message : "Analiz verisi alınamadı.",
        });
      });
    return () => controller.abort();
  }, [query, rangeKey, refreshKey]);

  const applyCustomRange = () => {
    if (!draftStartDate || !draftEndDate || draftStartDate > draftEndDate || customRangeDays > 366) return;
    setDateRange({ type: "custom", startDate: draftStartDate, endDate: draftEndDate });
  };

  useEffect(() => {
    let isMounted = true;
    let liveViewDisabled = false;
    let requestController: AbortController | null = null;

    const updateLiveReport = async () => {
      if (liveViewDisabled || document.visibilityState !== "visible") return;
      requestController?.abort();
      requestController = new AbortController();

      try {
        const response = await fetch("/api/admin/ga-analytics?view=live", {
          signal: requestController.signal,
        });
        if (response.status === 503) liveViewDisabled = true;
        const body: unknown = await response.json();
        if (!response.ok) {
          const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Canlı analiz verisi alınamadı.";
          throw new Error(message);
        }
        if (isMounted) setLiveResult({ report: body as LiveReport });
      } catch (liveError: unknown) {
        if (liveError instanceof DOMException && liveError.name === "AbortError") return;
        if (isMounted) {
          setLiveResult({
            error: liveError instanceof Error ? liveError.message : "Canlı analiz verisi alınamadı.",
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void updateLiveReport();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    void updateLiveReport();
    const interval = window.setInterval(() => void updateLiveReport(), 30_000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      requestController?.abort();
    };
  }, []);

  const stats = report
    ? [
        { label: "Sayfa görüntüleme", value: report.totals.views, previous: report.previousTotals.views, icon: "◉", color: "bg-indigo-50 text-indigo-700" },
        { label: "Aktif kullanıcı", value: report.totals.visitors, previous: report.previousTotals.visitors, icon: "♙", color: "bg-sky-50 text-sky-700" },
        { label: "Oturum", value: report.totals.sessions, previous: report.previousTotals.sessions, icon: "↗", color: "bg-violet-50 text-violet-700" },
        { label: "Etkileşim oranı", value: report.totals.engagementRate, previous: report.previousTotals.engagementRate, format: percentFormat, icon: "✦", color: "bg-emerald-50 text-emerald-700" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-600">GA4 • Site performansı</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Site Analizi</h1>
          <p className="mt-1 text-sm text-slate-500">Trafiği ve ziyaretçi davranışını takip edin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Rapor dönemi">
            {[
              { value: "today" as const, label: "Bugün" },
              { value: "yesterday" as const, label: "Dün" },
              { value: "7" as const, label: "7 gün" },
              { value: "30" as const, label: "30 gün" },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDateRange({ type: "preset", value: preset.value })}
                aria-pressed={dateRange.type === "preset" && dateRange.value === preset.value}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${dateRange.type === "preset" && dateRange.value === preset.value ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <span aria-hidden="true" className={loading ? "animate-spin" : ""}>↻</span>
            {loading ? "Yükleniyor" : "Yenile"}
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-800">Özel tarih aralığı</h2>
          <p className="mt-1 text-[11px] text-slate-500">İki tarih arasındaki günlük ve ürün analizini görüntüleyin (en fazla 366 gün).</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-[10px] font-semibold text-slate-500">
            Başlangıç
            <input
              type="date"
              value={draftStartDate}
              max={today}
              onChange={(event) => setDraftStartDate(event.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="grid gap-1 text-[10px] font-semibold text-slate-500">
            Bitiş
            <input
              type="date"
              value={draftEndDate}
              min={draftStartDate}
              max={today}
              onChange={(event) => setDraftEndDate(event.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!draftStartDate || !draftEndDate || draftStartDate > draftEndDate || customRangeDays > 366 || loading}
            className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              dateRange.type === "custom" ? "bg-indigo-600 text-white" : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            Tarihi uygula
          </button>
        </div>
        {customRangeDays > 366 && (
          <p className="text-xs text-rose-700" role="alert">Tarih aralığı en fazla 366 gün olabilir.</p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100/80 px-4 py-3 text-xs text-slate-600">
        <span>
          Seçilen dönem:{" "}
          <strong className="font-semibold text-slate-800">
            {dateRange.type === "custom"
              ? `${dateRange.startDate} – ${dateRange.endDate}`
              : dateRange.value === "today"
                ? "Bugün"
                : dateRange.value === "yesterday"
                  ? "Dün"
                  : `Son ${dateRange.value} gün`}
          </strong>
          {" · "}Önceki eşit uzunluktaki dönemle karşılaştırılır.
        </span>
        <span>{report?.updatedAt ? `Son güncelleme: ${new Date(report.updatedAt).toLocaleString("tr-TR")}` : "GA4 verileri gecikmeli güncellenebilir."}</span>
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="shrink-0 font-semibold underline">
            Tekrar dene
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Şu anda sitede</h2>
              <p className="text-xs text-slate-500">
                GA4 canlı raporu · 30 sn’de bir yenilenir
                {liveResult?.report ? ` · Son kontrol ${new Date(liveResult.report.updatedAt).toLocaleTimeString("tr-TR")}` : ""}
              </p>
            </div>
          </div>
          {liveResult?.report ? (
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums text-emerald-700">{numberFormat.format(liveResult.report.activeUsers)}</p>
              <p className="text-[11px] text-slate-500">aktif kullanıcı</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{liveResult?.error ? "Canlı veri alınamadı" : "Canlı veri yükleniyor…"}</p>
          )}
        </div>
        {liveResult?.error ? (
          <p role="status" className="px-5 py-3 text-xs text-amber-700">{liveResult.error}</p>
        ) : liveResult?.report?.pages.length ? (
          <ul className="grid gap-x-6 divide-y divide-slate-100 px-5 sm:grid-cols-2 sm:divide-y-0">
            {liveResult.report.pages.map((page) => (
              <li key={page.title} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-xs last:border-0 sm:border-b sm:even:border-b-0">
                <span className="min-w-0 truncate text-slate-600" title={page.title}>{page.title}</span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900">{numberFormat.format(page.users)} aktif</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-xs text-slate-400">
            {liveResult?.report ? "Şu anda aktif sayfa görüntülemesi yok." : "GA4 canlı verisi bekleniyor…"}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Temel ölçümler">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  {loading ? <span className="text-slate-300">···</span> : (stat.format ?? numberFormat).format(stat.value)}
                </p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${stat.color}`}>{stat.icon}</span>
            </div>
            <div className="mt-4 min-h-5">
              {loading ? <span className="text-xs text-slate-300">Karşılaştırma yükleniyor…</span> : (
                <ChangeLabel current={stat.value} previous={stat.previous} />
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Günlük sayfa görüntüleme</h2>
            <p className="mt-1 text-xs text-slate-500">Seçilen dönemdeki günlük toplamlar</p>
          </div>
          {report && (
            <span className="text-xs font-semibold text-indigo-700">
              {numberFormat.format(report.totals.views)} görüntüleme
            </span>
          )}
        </div>
        <div className="flex h-56 items-end gap-1 overflow-x-auto pb-1 sm:gap-2" role="img" aria-label={`${chartDays} günlük sayfa görüntüleme grafiği`}>
          {daily.map((item, index) => (
            <div key={item.date} className="flex h-full min-w-[24px] flex-1 flex-col items-center justify-end gap-2 sm:min-w-0">
              <span className="text-[10px] font-medium text-slate-500">{item.views ? numberFormat.format(item.views) : ""}</span>
              <div className="flex h-full w-full items-end rounded-t-md bg-slate-50">
                <div
                  className="w-full rounded-t-md bg-indigo-500 transition-[height] hover:bg-indigo-600"
                  style={{ height: `${item.views ? Math.max(3, (item.views / maxViews) * 100) : 0}%` }}
                  title={`${dateFormat.format(new Date(`${item.date}T00:00:00Z`))}: ${numberFormat.format(item.views)} görüntüleme`}
                />
              </div>
              <span className="whitespace-nowrap text-[9px] text-slate-400 sm:text-[10px]">
                {chartDays <= 7 || index % Math.max(1, Math.ceil(daily.length / 7)) === 0 || index === daily.length - 1
                  ? dateFormat.format(new Date(`${item.date}T00:00:00Z`))
                  : ""}
              </span>
            </div>
          ))}
          {!loading && !daily.length && <p className="m-auto text-xs text-slate-400">Bu dönemde henüz veri yok.</p>}
          {loading && <p className="m-auto text-xs text-slate-400">Rapor yükleniyor…</p>}
        </div>
        {report?.daily.length ? (
          <div className="mt-5 max-h-64 overflow-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Gün</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Görüntüleme</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Kullanıcı</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Oturum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...report.daily].reverse().map((item) => (
                  <tr key={item.date}>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{dateFormat.format(new Date(`${item.date}T00:00:00Z`))}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">{numberFormat.format(item.views)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{numberFormat.format(item.users)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{numberFormat.format(item.sessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Ürün performansı</h2>
            <p className="mt-1 text-xs text-slate-500">Ürün detay sayfalarının görüntüleme, kullanıcı ve oturum verileri</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="product-analytics-search">Ürün ara</label>
            <input
              id="product-analytics-search"
              type="search"
              value={productSearch}
              onChange={(event) => {
                setProductSearch(event.target.value);
                setProductLimit(10);
              }}
              placeholder="Ürün adı veya SKU ara"
              className="min-w-48 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              {report ? `${numberFormat.format(filteredProducts.length)} / ${numberFormat.format(report.products.length)} ürün` : "Ürün verileri"}
            </span>
          </div>
        </div>
        {filteredProducts.length ? (
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ürün</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <button type="button" onClick={() => handleProductSort("views")} className="hover:text-slate-900">
                      Görüntüleme {productSortField === "views" ? (productSortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <button type="button" onClick={() => handleProductSort("users")} className="hover:text-slate-900">
                      Kullanıcı {productSortField === "users" ? (productSortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">
                    <button type="button" onClick={() => handleProductSort("sessions")} className="hover:text-slate-900">
                      Oturum {productSortField === "sessions" ? (productSortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProducts.map((product) => (
                  <tr key={product.path} className="transition hover:bg-slate-50">
                    <td className="max-w-[24rem] px-5 py-3">
                      <p className="truncate font-semibold text-slate-800" title={product.title}>{product.title}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400" title={product.path}>{product.path}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{numberFormat.format(product.views)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{numberFormat.format(product.users)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{numberFormat.format(product.sessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-xs text-slate-400">
            {loading ? "Ürün verileri yükleniyor…" : normalizedProductSearch ? "Aramayla eşleşen ürün bulunamadı." : "Bu dönemde ürün sayfası görüntülemesi yok."}
          </p>
        )}
        {displayedProducts.length < sortedProducts.length && (
          <div className="border-t border-slate-100 px-5 py-3 text-center">
            <button
              type="button"
              onClick={() => setProductLimit((limit) => limit + 10)}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Daha fazla ürün göster ({displayedProducts.length}/{sortedProducts.length})
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">En çok görüntülenen sayfalar</h2>
              <p className="mt-1 text-xs text-slate-500">Sayfa yollarına göre görüntüleme</p>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="sr-only" htmlFor="page-analytics-search">Sayfa ara</label>
            <input
              id="page-analytics-search"
              type="search"
              value={pageSearch}
              onChange={(event) => {
                setPageSearch(event.target.value);
                setPageLimit(10);
              }}
              placeholder="Sayfa yolu ara"
              className="min-w-40 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageSort("views")}
                aria-pressed={pageSortField === "views"}
                className={`rounded-md px-2 py-1.5 text-[10px] font-semibold ${pageSortField === "views" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
              >
                Görüntüleme {pageSortField === "views" ? (pageSortOrder === "asc" ? "↑" : "↓") : ""}
              </button>
              <button
                type="button"
                onClick={() => handlePageSort("users")}
                aria-pressed={pageSortField === "users"}
                className={`rounded-md px-2 py-1.5 text-[10px] font-semibold ${pageSortField === "users" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
              >
                Kullanıcı {pageSortField === "users" ? (pageSortOrder === "asc" ? "↑" : "↓") : ""}
              </button>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-slate-500">
              {report ? `${numberFormat.format(filteredPages.length)} / ${numberFormat.format(report.pages.length)}` : "—"}
            </span>
          </div>
          {displayedPages.length ? (
            <ol className="max-h-[28rem] divide-y divide-slate-100 overflow-auto">
              {displayedPages.map((page, index) => (
                <li key={page.path} className="flex items-center gap-3 py-3 text-sm first:pt-1 last:pb-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-700" title={page.path}>{page.path}</span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold tabular-nums text-slate-900">{numberFormat.format(page.views)}</span>
                    <span className="text-[10px] text-slate-400">{numberFormat.format(page.users)} kullanıcı</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">{loading ? "Yükleniyor…" : normalizedPageSearch ? "Aramayla eşleşen sayfa bulunamadı." : "Bu dönemde sayfa verisi yok."}</p>
          )}
          {displayedPages.length < sortedPages.length && (
            <div className="border-t border-slate-100 pt-3 text-center">
              <button
                type="button"
                onClick={() => setPageLimit((limit) => limit + 10)}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Daha fazla sayfa göster ({displayedPages.length}/{sortedPages.length})
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Etkinlikler</h2>
            <p className="mt-1 text-xs text-slate-500">GA4 tarafından toplanan olaylar</p>
          </div>
          {report?.events.length ? (
            <ol className="divide-y divide-slate-100">
              {report.events.map((event) => (
                <li key={event.name} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-1 last:pb-0">
                  <span className="min-w-0 truncate font-medium text-slate-700" title={event.name}>{eventLabels[event.name] ?? event.name}</span>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold tabular-nums text-emerald-800">{numberFormat.format(event.count)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">{loading ? "Yükleniyor…" : "Bu dönemde etkinlik verisi yok."}</p>
          )}
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownCard title="Trafik kaynakları" items={report?.referrers ?? []} emptyText="Trafik kaynağı verisi bulunamadı." />
        <BreakdownCard title="Cihazlar" items={report?.devices ?? []} emptyText="Cihaz verisi bulunamadı." />
        <BreakdownCard title="Ülkeler" items={report?.countries ?? []} emptyText="Ülke verisi bulunamadı." />
        <BreakdownCard title="Tarayıcılar" items={report?.browsers ?? []} emptyText="Tarayıcı verisi bulunamadı." />
      </div>
    </div>
  );
}
