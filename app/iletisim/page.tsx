import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "İletişim | EZM Oto Yedek Parça & Aksesuar",
  description:
    "EZM Oto Yedek Parça iletişim bilgileri. Isparta Sanayi Sitesi adresimiz, WhatsApp hızlı sipariş hattımız, Trendyol ve N11 mağazalarımız ile parça sorgulama desteği.",
  keywords: [
    "EZM Oto iletişim",
    "Isparta oto yedek parça telefon",
    "EZM Oto adres",
    "oto elektrik soket sipariş",
    "EZM Oto Trendyol",
    "EZM Oto N11",
    "EZM Oto Instagram",
    "Trendyol EZM OTO",
  ],
  openGraph: {
    title: "İletişim | EZM Oto Yedek Parça & Aksesuar",
    description:
      "Bize telefon, WhatsApp, Trendyol veya N11 mağazamızdan ulaşabilirsiniz.",
    url: "https://ezmoto.com.tr/iletisim",
    siteName: "EZM Oto",
    locale: "tr_TR",
    type: "website",
  },
};

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
      closes: "18:30",
    },
  ],
};

const contactCards = [
  {
    icon: "💬",
    title: "WhatsApp Sipariş",
    text: "Parça fotoğrafı veya OEM numarasını ileterek anında stok ve fiyat sorgulayın.",
    href: "https://wa.me/905546588556",
    buttonText: "WhatsApp'tan Yazın",
    tone: "emerald",
  },
  {
    icon: "📞",
    title: "Telefon ile Arayın",
    text: "Mesai saatleri içerisinde doğrudan arayarak bilgi alabilirsiniz.",
    href: "tel:+905546588556",
    buttonText: "0554 658 85 56",
    tone: "blue",
  },
  {
    icon: "🛒",
    title: "Trendyol Mağazamız",
    text: "Ürünlerimizi Trendyol mağazamız üzerinden inceleyebilir ve güvenli şekilde sipariş verebilirsiniz.",
    href: "https://www.trendyol.com/magaza/ezm-oto-m-1258548?sst=0",
    buttonText: "Trendyol Mağazasına Git",
    tone: "orange",
  },
  {
    icon: "🛍️",
    title: "N11 Mağazamız",
    text: "Ürünlerimizi N11 mağazamız üzerinden inceleyebilir ve güvenli şekilde sipariş verebilirsiniz.",
    href: "https://www.n11.com/magaza/ezmoto",
    buttonText: "N11 Mağazasına Git",
    tone: "pink",
  },
  {
    icon: "📸",
    title: "Instagram",
    text: "Son ürünler, kampanyalar ve güncel stok bilgilerini Instagram üzerinden takip edin.",
    href: "https://www.instagram.com/ezm_oto/",
    buttonText: "Instagram'da Takip Et",
    tone: "purple",
  },
];

const businessHours = [
  { label: "Pazartesi - Cumartesi", value: "08:30 - 18:30" },
  { label: "Pazar", value: "Kapalı" },
];

export default function IletisimPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema),
        }}
      />

      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 py-16 px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Bize Ulaşın
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            İletişim & Konum
          </h1>

          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Aradığınız parça kodu, soket numunesi veya toplu siparişleriniz için
            dilediğiniz kanaldan bize ulaşabilirsiniz.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {contactCards.map((card) => (
            <article
              key={card.title}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-xl ${
                    card.tone === "emerald"
                      ? "bg-emerald-100 text-emerald-600"
                      : card.tone === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : card.tone === "orange"
                          ? "bg-orange-100 text-orange-600"
                          : card.tone === "purple"
                            ? "bg-violet-100 text-violet-600"
                            : "bg-pink-100 text-pink-600"
                  } flex items-center justify-center text-2xl mb-4`}
                >
                  {card.icon}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {card.title}
                </h3>

                <p className="text-sm text-slate-500 mb-4">{card.text}</p>
              </div>

              <a
                href={card.href}
                target={card.href.startsWith("http") ? "_blank" : undefined}
                rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                title={card.title}
                className={`inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                  card.tone === "emerald"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : card.tone === "blue"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : card.tone === "orange"
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : card.tone === "purple"
                          ? "bg-violet-600 hover:bg-violet-700 text-white"
                          : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
              >
                {card.buttonText}
              </a>
            </article>
          ))}

          <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-4">
                ⏰
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Çalışma Saatleri
              </h3>

              <ul className="text-sm text-slate-600 space-y-2 mb-4">
                {businessHours.map((item) => (
                  <li key={item.label} className="flex justify-between gap-3">
                    <span>{item.label}:</span>
                    <span
                      className={
                        item.value === "Kapalı"
                          ? "text-slate-400 font-medium"
                          : "font-semibold text-slate-900 whitespace-nowrap"
                      }
                    >
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-lg text-center border border-slate-100">
              Online katalog üzerinden 7/24 parça inceleyebilirsiniz.
            </div>
          </article>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mağaza & Depo Adresi</h2>
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

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6">
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Adres</p>
                  <p>Yeni Sanayi Sitesi</p>
                  <p>Merkez / Isparta</p>
                  <p>Türkiye</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 mb-1">İletişim</p>
                  <p>Telefon: +90 554 658 85 56</p>
                  <p>WhatsApp: +90 554 658 85 56</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 mb-1">Hizmet</p>
                  <p>Parça sorgulama, stok kontrolü, toplu sipariş ve perakende satış</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 flex flex-col justify-between gap-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Elden Teslimat</h4>
                <p className="text-sm text-slate-600">
                  Isparta içi arızalı veya eşleşmeyen parçalarınızı getirip birebir karşılaştırma yapabilirsiniz.
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
        </div>
      </section>
    </main>
  );
}
