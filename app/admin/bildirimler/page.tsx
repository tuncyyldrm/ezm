"use client";

import { useEffect, useState } from "react";

type Campaign = {
  id: string;
  title: string;
  body: string;
  target_url: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

type DashboardData = {
  subscriberCount: number;
  campaigns: Campaign[];
};

export default function AdminNotificationsPage() {
  const [dashboard, setDashboard] = useState<DashboardData>({
    subscriberCount: 0,
    campaigns: [],
  });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/admin/push")
      .then(async (response) => {
        const result = (await response.json()) as DashboardData & { error?: string };
        if (!response.ok) throw new Error(result.error || "Bildirim bilgileri alınamadı.");
        return result;
      })
      .then((result) => {
        if (isCurrent) setDashboard(result);
      })
      .catch((error: unknown) => {
        console.error("[Admin Push] Veriler yüklenemedi:", error);
        if (isCurrent) {
          setMessage(error instanceof Error ? error.message : "Bildirim bilgileri alınamadı.");
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const sendNotification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
      });
      const result = (await response.json()) as {
        error?: string;
        sentCount?: number;
        failedCount?: number;
      };

      if (!response.ok) throw new Error(result.error || "Bildirim gönderilemedi.");

      setMessage(
        `Gönderim tamamlandı: ${result.sentCount ?? 0} başarılı, ${result.failedCount ?? 0} başarısız.`
      );
      setTitle("");
      setBody("");
      setUrl("/");
      const dashboardResponse = await fetch("/api/admin/push");
      const dashboardResult = (await dashboardResponse.json()) as DashboardData & {
        error?: string;
      };
      if (!dashboardResponse.ok) {
        throw new Error(dashboardResult.error || "Gönderim geçmişi yenilenemedi.");
      }
      setDashboard(dashboardResult);
    } catch (error) {
      console.error("[Admin Push] Gönderim başarısız:", error);
      setMessage(error instanceof Error ? error.message : "Bildirim gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Push Bildirimleri
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          İzin veren kullanıcılara indirim, kampanya ve önemli duyurular gönderin.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Bildirim izni veren kullanıcı</p>
        <p className="mt-2 text-4xl font-black text-slate-900">
          {loading ? "…" : dashboard.subscriberCount.toLocaleString("tr-TR")}
        </p>
      </section>

      <form
        onSubmit={sendNotification}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-slate-900">Yeni bildirim oluştur</h2>

        <label className="block text-sm font-semibold text-slate-700">
          Başlık
          <input
            required
            maxLength={60}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Örn. Bu haftaya özel indirim"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <span className="mt-1 block text-right text-xs font-normal text-slate-400">
            {title.length}/60
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Mesaj
          <textarea
            required
            maxLength={200}
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Kampanya veya duyuru mesajınızı yazın."
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <span className="mt-1 block text-right text-xs font-normal text-slate-400">
            {body.length}/200
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Tıklanınca açılacak site bağlantısı
          <input
            required
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="/product/ürün-kodu"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Site içi adres (/) veya Instagram gibi HTTPS bağlantısı girin.
          </span>
        </label>

        {message && (
          <p aria-live="polite" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={sending || dashboard.subscriberCount === 0}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Gönderiliyor..." : "Abonelere Gönder"}
        </button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Son gönderimler</h2>
        {dashboard.campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Henüz bildirim gönderilmedi.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {dashboard.campaigns.map((campaign) => (
              <li key={campaign.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <h3 className="font-semibold text-slate-900">{campaign.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{campaign.body}</p>
                    <p className="mt-1 break-all text-xs text-blue-700">{campaign.target_url}</p>
                  </div>
                  <div className="shrink-0 text-xs text-slate-500 sm:text-right">
                    <p>{new Date(campaign.created_at).toLocaleString("tr-TR")}</p>
                    <p className="mt-1">
                      {campaign.sent_count} başarılı · {campaign.failed_count} başarısız
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
