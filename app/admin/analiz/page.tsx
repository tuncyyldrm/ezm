"use client";

import { useEffect, useState } from "react";

type AnalyticsReport = {
  totals: { views: number; visitors: number; sessions: number };
  daily: Array<{ date: string; views: number }>;
  top_pages: Array<{ path: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
  referrers: Array<{ source: string; views: number }>;
  searches: Array<{ term: string; count: number }>;
};

const numberFormat = new Intl.NumberFormat("tr-TR");
const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

function Ranking({ title, rows, empty }: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  empty: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-slate-800">{title}</h2>
      {rows.length ? (
        <ol className="space-y-4">
          {rows.map(({ label, value }, index) => {
            return (
              <li key={`${label}-${index}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-slate-600">{label}</span>
                  <span className="shrink-0 font-semibold text-slate-900">{numberFormat.format(value)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="py-6 text-center text-xs text-slate-400">{empty}</p>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [result, setResult] = useState<{
    days: number;
    report?: AnalyticsReport;
    error?: string;
  } | null>(null);
  const loading = result?.days !== days;
  const report = result?.days === days ? result.report ?? null : null;
  const error = result?.days === days ? result.error ?? "" : "";

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/admin/analytics?days=${days}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Analiz raporu yüklenemedi.");
        setResult({ days, report: result.analytics as AnalyticsReport });
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setResult({
          days,
          error: fetchError instanceof Error ? fetchError.message : "Analiz raporu yüklenemedi.",
        });
      });

    return () => controller.abort();
  }, [days]);

  const daily = report?.daily ?? [];
  const maxDailyViews = Math.max(...daily.map((day) => day.views), 1);
  const stats = [
    { label: "Sayfa görüntüleme", value: report?.totals.views ?? 0, icon: "👁️", color: "bg-blue-500" },
    { label: "Tekil ziyaretçi", value: report?.totals.visitors ?? 0, icon: "👤", color: "bg-violet-500" },
    { label: "Oturum", value: report?.totals.sessions ?? 0, icon: "🔗", color: "bg-emerald-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Site Analizi</h1>
          <p className="mt-1 text-sm text-slate-500">Birinci taraf ölçüm · Supabase verileri</p>
        </div>
        <div className="flex gap-2" aria-label="Rapor dönemi">
          {[7, 30, 90].map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              aria-pressed={days === period}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${days === period ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {period} gün
            </button>
          ))}
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} text-xl text-white`}>{stat.icon}</span>
            <div>
              <p className="text-2xl font-black text-slate-900">{loading ? "…" : numberFormat.format(stat.value)}</p>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Günlük sayfa görüntüleme</h2>
          {loading && <span className="text-xs text-slate-400">Yükleniyor…</span>}
        </div>
        <div className="flex h-48 items-end gap-1 sm:gap-2">
          {daily.map((day, index) => (
            <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-slate-500">{day.views ? numberFormat.format(day.views) : ""}</span>
              <div className="flex h-full w-full items-end">
                <div
                  className="w-full rounded-t-md bg-indigo-500 transition-all"
                  style={{ height: `${day.views ? Math.max(4, (day.views / maxDailyViews) * 100) : 0}%` }}
                  title={`${dateFormat.format(new Date(`${day.date}T00:00:00Z`))}: ${numberFormat.format(day.views)}`}
                />
              </div>
              <span className="text-[9px] text-slate-400 sm:text-[10px]">
                {days < 90 || index % 7 === 0 || index === daily.length - 1
                  ? dateFormat.format(new Date(`${day.date}T00:00:00Z`))
                  : ""}
              </span>
            </div>
          ))}
          {!loading && !report?.daily.length && <p className="m-auto text-xs text-slate-400">Henüz veri yok</p>}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Ranking
          title="En çok görüntülenen sayfalar"
          rows={(report?.top_pages ?? []).map((page) => ({ label: page.path, value: page.views }))}
          empty="Bu dönemde sayfa görüntüleme yok."
        />
        <Ranking
          title="Aranan terimler"
          rows={(report?.searches ?? []).map((search) => ({ label: search.term, value: search.count }))}
          empty="Bu dönemde arama kaydı yok."
        />
        <Ranking
          title="Cihazlar"
          rows={(report?.devices ?? []).map((device) => ({
            label: ({ mobile: "Mobil", tablet: "Tablet", desktop: "Masaüstü" } as Record<string, string>)[device.device] ?? "Diğer",
            value: device.views,
          }))}
          empty="Cihaz verisi bulunamadı."
        />
        <Ranking
          title="Yönlendiren kaynaklar"
          rows={(report?.referrers ?? []).map((referrer) => ({ label: referrer.source, value: referrer.views }))}
          empty="Harici yönlendirme kaydı yok."
        />
      </div>
    </div>
  );
}
