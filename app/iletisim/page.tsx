import type { Metadata } from "next";
import Link from "next/link";
import InstallAppCard from "@/components/InstallAppCard";
import { getAbsoluteUrl } from "@/lib/site";

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
    url: getAbsoluteUrl("/iletisim"),
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
  url: getAbsoluteUrl("/iletisim"),
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
];

const otherChannels = [
  {
    title: "Trendyol",
    href: "https://www.trendyol.com/magaza/ezm-oto-m-1258548?sst=0",
  },
  {
    title: "N11",
    href: "https://www.n11.com/magaza/ezmoto",
  },
  {
    title: "Instagram",
    href: "https://www.instagram.com/ezm_oto/",
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
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {contactCards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div>
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                    card.tone === "emerald"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {card.icon}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {card.title}
                </h3>
                <p className="mb-5 text-sm text-slate-500">{card.text}</p>
              </div>

              <a
                href={card.href}
                target={card.href.startsWith("http") ? "_blank" : undefined}
                rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                title={card.title}
                className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors ${
                  card.tone === "emerald"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {card.buttonText}
              </a>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="font-medium text-slate-500">Diğer kanallar:</span>
          {otherChannels.map((channel) => (
            <a
              key={channel.title}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              {channel.title}
              <span className="sr-only"> (yeni sekmede açılır)</span>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Adres ve Çalışma Saatleri</h2>
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <h3 className="mb-3 font-semibold text-slate-900">Çalışma Saatleri</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {businessHours.map((item) => (
                  <li key={item.label} className="flex justify-between gap-3">
                    <span>{item.label}</span>
                    <span className={item.value === "Kapalı" ? "text-slate-400" : "font-semibold text-slate-900"}>
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
                Online kataloğumuzu 7/24 inceleyebilirsiniz.
              </p>
            </div>

            <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <div>
                <h3 className="mb-2 font-semibold text-slate-900">Elden Teslimat</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Isparta&apos;da parça numunesiyle mağazamıza uğrayıp ürün
                  karşılaştırması için destek alabilirsiniz.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex w-fit items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Kataloğa Dön
              </Link>
            </div>
          </div>
        </div>
        <InstallAppCard />
      </section>
    </main>
  );
}
