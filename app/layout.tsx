
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getBaseUrl } from '@/lib/site';
import ScrollToTop from "@/components/ScrollToTop";
import ScrollRestorationManager from "@/components/ScrollRestorationManager";
import CookieBanner from "@/components/CookieBanner";
import ConsentVercelAnalytics from "@/components/ConsentVercelAnalytics";
import PushSubscriptionControl from "@/components/PushSubscriptionControl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e40af",
};

export const metadata: Metadata = {
  title: {
    default: "EZM OTO - Yedek Parça Kataloğu",
    template: "%s | EZM OTO",
  },
  description:
    "Oto yedek parça kataloğu. OEM numaraları, uyumlu araçlar ve detaylı ürün bilgileri. WhatsApp ile hızlı sipariş.",
  keywords: [
    "oto yedek parça",
    "yedek parça",
    "OEM",
    "araba parçası",
    "otomotiv",
    "EZM OTO",
  ],
  authors: [{ name: "EZM OTO" }],
  creator: "EZM OTO",
  publisher: "EZM OTO",

  metadataBase: new URL(getBaseUrl()),

  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "EZM OTO",
    title: "EZM OTO - Yedek Parça Kataloğu",
    description:
      "Online oto yedek parça kataloğu. Özel fiyatlar ve hızlı teslimat.",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 1200,
        height: 630,
        alt: "EZM OTO",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "EZM OTO - Yedek Parça Kataloğu",
    description:
      "Online oto yedek parça kataloğu. Özel fiyatlar ve hızlı teslimat.",
    images: ["/android-chrome-512x512.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  category: "Otomotiv",
};

const globalStoreSchema = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  "@id": `${getBaseUrl()}/#organization`,
  name: "EZM OTO",
  description: "Oto yedek parça satış ve online katalog platformu.",
  url: getBaseUrl(),
  telephone: "+905546588556",
  priceRange: "₺",
  image: `${getBaseUrl()}/android-chrome-512x512.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Yedek Parça Sanayi Sitesi",
    addressLocality: "Merkez",
    addressRegion: "Isparta",
    addressCountry: "TR",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    opens: "08:30",
    closes: "18:30",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://erntysmhwfxkrtegirds.supabase.co"
        />

        <link
          rel="dns-prefetch"
          href="https://erntysmhwfxkrtegirds.supabase.co"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(globalStoreSchema),
          }}
        />
      </head>

      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-gray-50 text-gray-900 selection:bg-blue-500 selection:text-white overflow-x-hidden"
      >
        <ConsentVercelAnalytics />
        {/* ACCESSIBILITY */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Ana içeriğe geç
        </a>

        {/* HEADER */}
        <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center px-3 sm:px-4 lg:px-6">
            
            {/* HEADER CONTENT */}
            <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:gap-4">

              {/* LOGO */}
              <Link
                href="/"
                title="EZM OTO Ana Sayfa"
                className="shrink-0 text-base font-black tracking-tighter text-gray-900 transition-colors hover:text-blue-600 sm:text-lg md:text-xl"
              >
                EZM <span className="text-blue-600">OTO</span>
              </Link>

              {/* NAVIGATION */}
              <nav
                className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3 md:gap-5 lg:gap-6"
                aria-label="Ana Menü"
              >
                <Link
                  href="/blog"
                  className="shrink-0 whitespace-nowrap px-1 text-[11px] font-medium text-gray-600 transition-colors hover:text-blue-600 sm:px-0 sm:text-xs md:text-sm"
                >
                  Blog
                </Link>

                <Link
                  href="/hakkimizda"
                  className="shrink-0 whitespace-nowrap px-1 text-[11px] font-medium text-gray-600 transition-colors hover:text-blue-600 sm:px-0 sm:text-xs md:text-sm"
                >
                  Hakkımızda
                </Link>

                <Link
                  href="/iletisim"
                  className="shrink-0 whitespace-nowrap px-1 text-[11px] font-medium text-gray-600 transition-colors hover:text-blue-600 sm:px-0 sm:text-xs md:text-sm"
                >
                  İletişim
                </Link>

                {/* WHATSAPP */}
                <a
                  href="https://wa.me/905546588556"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp Hızlı Sipariş Hattı"
                  aria-label="WhatsApp Hızlı Sipariş Hattı"
                  className="flex shrink-0 items-center justify-center rounded-lg bg-green-600 px-2.5 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98] sm:rounded-xl sm:px-3 sm:text-xs md:px-4 md:text-sm"
                >
                  <span className="sm:hidden">Sipariş</span>
                  <span className="hidden sm:inline">Sipariş Hattı</span>
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-x-hidden"
        >
          {children}
        </main>

        {/* FOOTER */}
        <footer
          className="mt-auto border-t border-gray-200 bg-white"
          role="contentinfo"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <PushSubscriptionControl />

            <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
              
              {/* COPYRIGHT */}
              <p className="text-xs leading-relaxed text-gray-500 sm:text-sm">
                &copy; {currentYear} EZM OTO. Tüm hakları saklıdır.
              </p>

              {/* FOOTER LINKS */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-5">
                <Link
                  href="/hakkimizda"
                  className="text-xs text-gray-500 transition-colors hover:text-blue-600"
                >
                  Hakkımızda
                </Link>

                <Link
                  href="/iletisim"
                  className="text-xs text-gray-500 transition-colors hover:text-blue-600"
                >
                  İletişim
                </Link>

                <Link
                  href="/soket"
                  className="text-xs text-gray-400 transition-colors hover:text-blue-600"
                >
                  Soket
                </Link>

                <a
                  href="https://wa.me/905546588556"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 transition-colors hover:text-green-600"
                >
                  İletişim Hattı
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* GLOBAL CLIENT COMPONENTS */}
        <ScrollToTop />
        <ScrollRestorationManager />
        <CookieBanner />
      </body>
    </html>
  );
}