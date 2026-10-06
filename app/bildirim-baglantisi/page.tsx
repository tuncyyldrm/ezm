import type { Metadata } from "next";
import Link from "next/link";
import NotificationLinkRedirect from "@/components/NotificationLinkRedirect";

export const metadata: Metadata = {
  title: "Bağlantı açılıyor | EZM OTO",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotificationLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;

  if (!rawUrl) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-xl font-bold text-slate-900">Bağlantı bulunamadı</h1>
        <Link href="/" className="mt-5 font-semibold text-blue-700 hover:underline">
          EZM OTO ana sayfasına dön
        </Link>
      </main>
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
    if (
      targetUrl.protocol !== "https:" ||
      targetUrl.username ||
      targetUrl.password
    ) {
      throw new Error("Unsupported redirect URL");
    }
  } catch {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-xl font-bold text-slate-900">Bağlantı açılamıyor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bu bildirim güvenli bir HTTPS bağlantısı içermiyor.
        </p>
        <Link href="/" className="mt-5 font-semibold text-blue-700 hover:underline">
          EZM OTO ana sayfasına dön
        </Link>
      </main>
    );
  }

  return <NotificationLinkRedirect targetUrl={targetUrl.href} />;
}
