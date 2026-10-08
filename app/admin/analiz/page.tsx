"use client";

import { useEffect, useState } from "react";

type Report = {
  days: number;
  totals: { views: number; visitors: number; sessions: number; engagementRate: number };
  daily: Array<{ date: string; views: number }>;
  pages: Array<{ path: string; views: number }>;
  devices: Array<{ name: string; views: number }>;
  countries: Array<{ name: string; views: number }>;
  referrers: Array<{ name: string; views: number }>;
  browsers: Array<{ name: string; views: number }>;
  updatedAt: string;
};

const numberFormat = new Intl.NumberFormat("tr-TR");
const percentFormat = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

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
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(4, (item.views / maxViews) * 100)}%` }} />
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
  const [days, setDays] = useState(7);
  const [result, setResult] = useState<{ days: number; report?: Report; error?: string } | null>(null);
  const loading = result?.days !== days;
  const report = result?.days === days ? result.report ?? null : null;
  const error = result?.days === days ? result.error ?? "" : "";
  const daily = report?.daily ?? [];
  const maxViews = Math.max(...daily.map((item) => item.views), 1);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/ga-analytics?days=${days}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Analiz verisi alınamadı.");
        setResult({ days, report: body as Report });
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setResult({
          days,
          error: fetchError instanceof Error ? fetchError.message : "Analiz verisi alınamadı.",
        });
      });
    return () => controller.abort();
  }, [days]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Site Analizi</h1>
          <p className="mt-1 text-sm text-slate-500">Google Analytics 4 verileri</p>
        </div>
        <div className="flex gap-2" aria-label="Rapor dönemi">
          {[7, 30].map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              aria-pressed={days === period}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${days === period ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
            >
              {period} gün
            </button>
          ))}
        </div>
      </header>
      <p className="text-xs text-slate-500">
        Raporlar GA4’ten alınır; verilerin raporlara yansıması zaman alabilir.
      </p>

      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Sayfa görüntüleme", value: report?.totals.views ?? 0, icon: "👁️" },
          { label: "Aktif kullanıcı", value: report?.totals.visitors ?? 0, icon: "👤" },
          { label: "Oturum", value: report?.totals.sessions ?? 0, icon: "🧭" },
          {
            label: "Etkileşim oranı",
            value: report?.totals.engagementRate ?? 0,
            format: percentFormat,
            icon: "✨",
          },
        ].map((stat) => (
          <article key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white">{stat.icon}</span>
            <div>
              <p className="text-2xl font-black text-slate-900">
                {loading ? "…" : (stat.format ?? numberFormat).format(stat.value)}
              </p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-slate-800">Günlük sayfa görüntüleme</h2>
        <div className="flex h-48 items-end gap-1 sm:gap-2">
          {daily.map((item, index) => (
            <div key={`${item.date}-${index}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] text-slate-500">{item.views ? numberFormat.format(item.views) : ""}</span>
              <div className="flex h-full w-full items-end">
                <div
                  className="w-full rounded-t bg-indigo-500"
                  style={{ height: `${item.views ? Math.max(4, (item.views / maxViews) * 100) : 0}%` }}
                  title={`${item.date}: ${numberFormat.format(item.views)}`}
                />
              </div>
              <span className="text-[9px] text-slate-400 sm:text-[10px]">
                {days < 90 || index % 7 === 0 || index === daily.length - 1
                  ? dateFormat.format(new Date(`${item.date}T00:00:00Z`))
                  : ""}
              </span>
            </div>
          ))}
          {!loading && !daily.length && <p className="m-auto text-xs text-slate-400">Henüz veri yok.</p>}
          {loading && <p className="m-auto text-xs text-slate-400">Yükleniyor…</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-slate-800">En çok görüntülenen sayfalar</h2>
        {report?.pages.length ? (
          <ol className="space-y-3">
            {report.pages.map((page) => (
              <li key={page.path} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-0">
                <span className="truncate text-slate-600">{page.path}</span>
                <span className="shrink-0 font-semibold text-slate-900">{numberFormat.format(page.views)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-6 text-center text-xs text-slate-400">{loading ? "Yükleniyor…" : "Bu dönemde sayfa verisi yok."}</p>
        )}
        {report?.updatedAt && (
          <p className="mt-3 text-right text-[10px] text-slate-400">
            Güncellendi: {new Date(report.updatedAt).toLocaleString("tr-TR")}
          </p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownCard title="Cihazlar" items={report?.devices ?? []} emptyText="Cihaz verisi bulunamadı." />
        <BreakdownCard title="Ülkeler" items={report?.countries ?? []} emptyText="Ülke verisi bulunamadı." />
        <BreakdownCard title="Trafik kaynakları" items={report?.referrers ?? []} emptyText="Trafik kaynağı verisi bulunamadı." />
        <BreakdownCard title="Tarayıcılar" items={report?.browsers ?? []} emptyText="Tarayıcı verisi bulunamadı." />
      </div>
    </div>
  );
}
