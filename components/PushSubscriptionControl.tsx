"use client";

import { useEffect, useState } from "react";

function decodeVapidKey(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = window.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export default function PushSubscriptionControl() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker
        .getRegistration("/")
        .then((registration) => registration?.pushManager.getSubscription())
        .then((subscription) => setSubscribed(Boolean(subscription)))
        .catch((error: unknown) => {
          console.error("[Push] Mevcut abonelik kontrol edilemedi:", error);
        });
    }
  }, []);

  const enableNotifications = async () => {
    setLoading(true);
    setMessage("");

    try {
      const pushSupported =
        window.isSecureContext &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!pushSupported) {
        setMessage("Bu tarayıcı bildirimleri desteklemiyor veya güvenli bağlantı kullanmıyor.");
        return;
      }

      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (isIos && !isInstalled) {
        setMessage("iPhone/iPad'de bildirimler için önce Safari'den Ana Ekrana Ekle seçeneğini kullanın.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMessage("Bildirim aboneliği henüz yapılandırılmamış.");
        return;
      }

      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

      if (permission !== "granted") {
        setMessage(
          permission === "denied"
            ? "Bildirim izni kapalı. İzinleri tarayıcı ayarlarından açabilirsiniz."
            : "Bildirim izni verilmedi."
        );
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const readyRegistration = await navigator.serviceWorker.ready;
      const subscription =
        (await readyRegistration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(publicKey),
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "Abonelik kaydedilemedi.");
      }

      setSubscribed(true);
      setMessage("İndirim ve duyuru bildirimleri açıldı.");
    } catch (error) {
      console.error("[Push] Bildirim aboneliği açılamadı:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Bildirimler açılamadı. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    setLoading(true);
    setMessage("");

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          throw new Error(result.error || "Abonelik kaldırılamadı.");
        }

        await subscription.unsubscribe();
      }

      setSubscribed(false);
      setMessage("Bildirim aboneliğiniz kapatıldı.");
    } catch (error) {
      console.error("[Push] Bildirim aboneliği kapatılamadı:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Abonelik kapatılamadı. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="push-notifications-title"
      className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6"
    >
      <div>
        <h2 id="push-notifications-title" className="text-sm font-bold text-slate-900">
          İndirim ve duyurulardan haberdar olun
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
          Bildirim izni verirseniz kampanya ve önemli duyurular cihazınıza iletilir.
          İzninizi istediğiniz zaman bu alandan kaldırabilirsiniz.
        </p>
        {message && (
          <p aria-live="polite" className="mt-2 text-xs font-medium text-blue-800">
            {message}
          </p>
        )}
      </div>

      {subscribed ? (
        <button
          type="button"
          onClick={disableNotifications}
          disabled={loading}
          className="mt-3 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          {loading ? "İşleniyor..." : "Bildirimleri Kapat"}
        </button>
      ) : (
        <button
          type="button"
          onClick={enableNotifications}
          disabled={loading}
          className="mt-3 w-full shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          {loading ? "İşleniyor..." : "Bildirimleri Aç"}
        </button>
      )}
    </section>
  );
}
