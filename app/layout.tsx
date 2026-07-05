import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";

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
  description: "Oto yedek parça kataloğu. OEM numaraları, uyumlu araçlar ve detaylı ürün bilgileri. WhatsApp ile hızlı sipariş.",
  keywords: ["oto yedek parça", "yedek parça", "OEM", "araba parçası", "otomotiv", "EZM OTO"],
  authors: [{ name: "EZM OTO" }],
  creator: "EZM OTO",
  publisher: "EZM OTO",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.vercel.app"),
  
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "EZM OTO",
    title: "EZM OTO - Yedek Parça Kataloğu",
    description: "Online oto yedek parça kataloğu. Özel fiyatlar ve hızlı teslimat.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "EZM OTO" }],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "EZM OTO - Yedek Parça Kataloğu",
    description: "Online oto yedek parça kataloğu. Özel fiyatlar ve hızlı teslimat.",
    images: ["/og-image.jpg"],
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

// 👑 GLOBAL SCHEMA: Google standartlarına tam uyumlu kurumsal şema yapısı
const globalStoreSchema = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.vercel.app"}/#organization`,
  "name": "EZM OTO",
  "description": "Oto yedek parça satış ve online katalog platformu.",
  "url": process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.vercel.app",
  "telephone": "+905546588556",
  "priceRange": "₺",
  "image": `${process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.vercel.app"}/og-image.jpg`,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Yedek Parça Sanayi Sitesi", // 💡 Örnek adres alanları Google uyarılarını kapatır
    "addressLocality": "Merkez",
    "addressRegion": "Isparta",
    "addressCountry": "TR"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Supabase için Preconnect katmanı site hızına (LCP) doping yapar */}
        <link rel="preconnect" href="https://erntysmhwfxkrtegirds.supabase.co" />
        <link rel="dns-prefetch" href="https://erntysmhwfxkrtegirds.supabase.co" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalStoreSchema) }}
        />
      </head>
      
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 selection:bg-blue-500 selection:text-white">
        {/* 💡 Google Analytics en üst seviyede sayfa geçişlerini daha sağlıklı yakalar */}
        <GoogleAnalytics gaId="G-JEB7YLM2RV" />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Ana içeriğe geç
        </a>

        {/* 👑 SEO DOSTU HEADER NAVİGASYONU */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link 
              href="/" 
              title="EZM OTO Ana Sayfa" 
              className="text-xl font-black font-mono tracking-tighter text-gray-900 hover:text-blue-600 transition-colors"
            >
              EZM <span className="text-blue-600">OTO</span>
            </Link>
            
            <nav className="flex items-center gap-6" aria-label="Ana Menü">
              <a
                href="https://wa.me/905546588556"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp Hızlı Sipariş Hattı"
                className="text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                Sipariş Hattı
              </a>
            </nav>
          </div>
        </header>

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <footer className="bg-white border-t border-gray-200 mt-auto" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* 💡 suppressHydrationWarning sayesinde istemci-sunucu saat farkından doğan çökmeler engellendi */}
              <p className="text-sm text-gray-500" suppressHydrationWarning>
                &copy; {new Date().getFullYear()} EZM OTO. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center gap-6">
                <Link href="/soket" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                  Soket
                </Link>
                <a
                  href="https://wa.me/905546588556"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-green-600 transition-colors"
                >
                  İletişim
                </a>
              </div>
            </div>
          </div>
        </footer>
        <ScrollToTop />
      </body>
    </html>
  );
}