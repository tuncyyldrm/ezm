import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
// 1. ADIM: Google Analytics bileşenini import edin
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

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
    default: "EZM OTO - Oto Yedek Parça Kataloğu",
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
    title: "EZM OTO - Oto Yedek Parça Kataloğu",
    description: "Online oto yedek parça kataloğu. Özel fiyatlar ve hızlı teslimat.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "EZM OTO" }],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "EZM OTO - Oto Yedek Parça Kataloğu",
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

// Schema.org - Organizasyon bilgisi
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  name: "EZM OTO",
  description: "Oto yedek parça satış ve katalog",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.vercel.app",
  telephone: "+905546588556",
  priceRange: "₺",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EZM OTO",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.vercel.app",
  potentialAction: {
    "@type": "SearchAction",
    target: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.vercel.app"}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
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
        {/* Preconnect - Performans */}
        <link rel="preconnect" href="https://erntysmhwfxkrtegirds.supabase.co" />
        <link rel="dns-prefetch" href="https://erntysmhwfxkrtegirds.supabase.co" />
        
        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      
      <body className="min-h-full flex flex-col bg-gray-50">
        {/* Erişilebilirlik - Skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Ana içeriğe geç
        </a>

        {/* Header */}


        {/* Ana İçerik */}
        <main id="main-content" className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} EZM OTO. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/soket" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                  Soket
                </Link>
                <a
                  href="https://wa.me/905546588556"
                  className="text-xs text-gray-400 hover:text-green-600 transition-colors"
                >
                  İletişim
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* 2. ADIM: Google Analytics'i buraya yerleştirin (G- ile başlayan kimliğinizi yazın) */}
        <GoogleAnalytics gaId="G-JEB7YLM2RV" />
      </body>
    </html>
  );
}