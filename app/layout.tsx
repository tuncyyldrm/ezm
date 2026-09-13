import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollRestorationManager from "@/components/ScrollRestorationManager";
import CoreStatusMonitor from "@/components/CoreStatusMonitor";
import CookieBanner from "@/components/CookieBanner";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.com.tr"
  ),

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
  "@id": `${
    process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.com.tr"
  }/#organization`,
  name: "EZM OTO",
  description: "Oto yedek parça satış ve online katalog platformu.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.com.tr",
  telephone: "+905546588556",
  priceRange: "₺",
  image: `${
    process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.com.tr"
  }/android-chrome-512x512.png`,
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
    closes: "19:00",
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
        className="min-h-full flex flex-col bg-gray-50 text-gray-900 selection:bg-blue-500 selection:text-white"
      >
        {/* Erişilebilirlik - Ana içeriğe geç */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Ana içeriğe geç
        </a>

        {/* HEADER */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
          <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 min-h-16 py-2 sm:py-0 flex items-center justify-between gap-3">
            {/* Logo */}
            <Link
              href="/"
              title="EZM OTO Ana Sayfa"
              className="shrink-0 text-lg sm:text-xl font-black font-mono tracking-tighter text-gray-900 hover:text-blue-600 transition-colors"
            >
              EZM <span className="text-blue-600">OTO</span>
            </Link>

            {/* Navigation */}
            <nav
              className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0"
              aria-label="Ana Menü"
            >
              <Link
                href="/hakkimizda"
                className="shrink-0 text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                Hakkımızda
              </Link>

              <Link
                href="/iletisim"
                className="shrink-0 text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                İletişim
              </Link>

              <a
                href="https://wa.me/905546588556"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp Hızlı Sipariş Hattı"
                aria-label="WhatsApp Hızlı Sipariş Hattı"
                className="shrink-0 text-xs sm:text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-2.5 sm:px-4 py-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span className="hidden xs:inline">Sipariş Hattı</span>
                <span className="xs:hidden">Sipariş</span>
              </a>
            </nav>
          </div>
        </header>

        {/* MAIN */}
        <main id="main-content" className="flex-1 min-w-0">
          {children}
        </main>

        {/* FOOTER */}
        <footer
          className="bg-white border-t border-gray-200 mt-auto"
          role="contentinfo"
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <p className="text-sm text-gray-500">
                &copy; {currentYear} EZM OTO. Tüm hakları saklıdır.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <Link
                  href="/hakkimizda"
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Hakkımızda
                </Link>

                <Link
                  href="/iletisim"
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  İletişim
                </Link>

                <Link
                  href="/soket"
                  className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                >
                  Soket
                </Link>

                <a
                  href="https://wa.me/905546588556"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-green-600 transition-colors"
                >
                  İletişim Hattı
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Global Client Components */}
        <ScrollToTop />
        <ScrollRestorationManager />
        <CoreStatusMonitor />
        <CookieBanner />
      </body>
    </html>
  );
}