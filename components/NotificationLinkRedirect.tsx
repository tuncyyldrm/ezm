"use client";

import { useEffect } from "react";

export default function NotificationLinkRedirect({
  targetUrl,
}: {
  targetUrl: string;
}) {
  useEffect(() => {
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-xl font-bold text-slate-900">Bağlantı açılıyor</h1>
      <p className="mt-2 text-sm text-slate-600">
        Lütfen bekleyin; yönlendirme başlamazsa aşağıdaki bağlantıya dokunun.
      </p>
      <a
        href={targetUrl}
        rel="noopener noreferrer"
        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Bağlantıya devam et
      </a>
    </main>
  );
}
