// app/iletisim/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "İletişim | EZM Oto Yedek Parça & Aksesuar",
  description:
    "EZM Oto Yedek Parça iletişim bilgileri. Isparta Sanayi Sitesi adresimiz, WhatsApp hızlı sipariş hattımız, Trendyol mağazamız ve parça sorgulama desteğimiz.",
  keywords: [
    "EZM Oto iletişim",
    "Isparta oto yedek parça telefon",
    "EZM Oto adres",
    "oto elektrik soket sipariş",
    "EZM Oto Trendyol",
    "Trendyol EZM OTO",
  ],
  openGraph: {
    title: "İletişim | EZM Oto Yedek Parça & Aksesuar",
    description:
      "Bize telefon, WhatsApp, Trendyol mağazamız veya iş yerimizden ulaşabilirsiniz.",
    url: "https://ezmoto.com.tr/iletisim",
    siteName: "EZM Oto",
    locale: "tr_TR",
    type: "website",
  },
};

// Yerel SEO için yapılandırılmış veri
const contactSchema = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  name: "EZM OTO Yedek Parça ve Aksesuar",
  telephone: "+905546588556",
  url: "https://ezmoto.com.tr/iletisim",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Yeni Sanayi Sitesi",
    addressLocality: "Merkez",
    addressRegion: "Isparta",
    addressCountry: "TR",
  },
  openingHoursSpecification: [
    {
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
  ],
};

export default function IletisimPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Yapılandırılmış Veri */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema),
        }}
      />

      {/* Banner Alanı */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 py-16 px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Bize Ulaşın
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            İletişim & Konum
          </h1>

          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Aradığınız parça kodu, soket numunesi veya toplu siparişleriniz
            için dilediğiniz kanaldan bize ulaşabilirsiniz.
          </p>
        </div>
      </section>

      {/* İletişim Kartları */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* WhatsApp */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-4">
                💬
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                WhatsApp Sipariş
              </h3>

              <p className="text-sm text-slate-500 mb-4">
                Parça fotoğrafı veya OEM numarasını ileterek stok ve fiyat
                sorgulayın.
              </p>
            </div>

            <a
              href="https://wa.me/905546588556"
              target="_blank"
              rel="noopener noreferrer"
              title="EZM OTO WhatsApp Sipariş Hattı"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              WhatsApp&apos;tan Yazın
            </a>
          </div>

          {/* Telefon */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4">
                📞
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Telefon ile Arayın
              </h3>

              <p className="text-sm text-slate-500 mb-4">
                Mesai saatleri içerisinde doğrudan arayarak bilgi
                alabilirsiniz.
              </p>
            </div>

            <a
              href="tel:+905546588556"
              title="EZM OTO Telefon"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              0554 658 85 56
            </a>
          </div>

          {/* Trendyol */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mb-4">
                🛒
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Trendyol Mağazamız
              </h3>

              <p className="text-sm text-slate-500 mb-4">
                Ürünlerimizi Trendyol mağazamız üzerinden inceleyebilir ve
                güvenli şekilde sipariş verebilirsiniz.
              </p>
            </div>

            <a
              href="https://www.trendyol.com/magaza/ezm-oto-m-1258548?sst=0"
              target="_blank"
              rel="noopener noreferrer"
              title="EZM OTO Trendyol Mağazası"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Trendyol Mağazasına Git
            </a>
          </div>

          {/* Çalışma Saatleri */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-4">
                ⏰
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Çalışma Saatleri
              </h3>

              <ul className="text-sm text-slate-600 space-y-1 mb-4">
                <li className="flex justify-between gap-3">
                  <span>Pzt. - Cmt.:</span>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    08:30 - 19:00
                  </span>
                </li>

                <li className="flex justify-between text-slate-400">
                  <span>Pazar:</span>
                  <span>Kapalı</span>
                </li>
              </ul>
            </div>

            <div className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-lg text-center border border-slate-100">
              Online katalog üzerinden 7/24 parça inceleyebilirsiniz.
            </div>
          </div>
        </div>

        {/* Adres & Konum */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Mağaza & Depo Adresi
              </h2>

              <p className="text-sm text-slate-600 mt-1">
                Yeni Sanayi Sitesi, Merkez / Isparta
              </p>
            </div>

            <a
              href="https://maps.google.com/?q=EZM+OTO+Yedek+Parça+Isparta"
              target="_blank"
              rel="noopener noreferrer"
              title="EZM OTO Google Haritalar"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Google Haritalar&apos;da Aç ↗
            </a>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-semibold text-slate-900">
                Elden Teslimat & Parça Numunesi
              </h4>

              <p className="text-sm text-slate-600">
                Isparta içi arızalı veya eşleşmeyen parçalarınızı getirip
                birebir karşılaştırma yapabilirsiniz.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              Kataloğa Dön
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
