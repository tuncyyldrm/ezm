import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hakkımızda | EZM Oto Yedek Parça & Aksesuar',
  description:
    'Isparta merkezli EZM Oto; araç elektrik soketi, tesisat kablosu, sensör, röle ve aydınlatma ürünleri için yedek parça kataloğu ve parça sorgulama desteği sunar.',
  keywords: [
    'EZM Oto',
    'Isparta oto yedek parça',
    'oto elektrik soket',
    'oto sensör',
    'OEM yedek parça',
    'EZM Oto Aksesuar',
    'Isparta oto elektrik yedek parça',
  ],
  openGraph: {
    title: 'Hakkımızda | EZM Oto Yedek Parça & Aksesuar',
    description:
      'EZM Oto’nun ürün gruplarını, parça sorgulama yaklaşımını ve müşterilerine sunduğu iletişim kanallarını keşfedin.',
    url: 'https://ezmoto.com.tr/hakkimizda',
    siteName: 'EZM Oto',
    locale: 'tr_TR',
    type: 'website',
  },
};

export default function HakkimizdaPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Üst Başlık Banner Alanı */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 py-16 px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Kurumsal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Hakkımızda
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Aradığınız otomotiv yedek parçasına ulaşmanız için anlaşılır bir katalog ve doğrudan iletişim.
          </p>
        </div>
      </section>

      {/* İçerik Alanı */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-8">
          {/* Biz Kimiz */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-3">
              Biz Kimiz?
            </h2>
            <p className="text-slate-600 leading-relaxed">
              <strong>EZM Oto Yedek Parça &amp; Aksesuar</strong>, Isparta merkezli bir otomotiv yedek parça işletmesidir.
              Dijital kataloğumuzda araç elektrik soketleri, tesisat kabloları, sensörler, anahtarlar,
              röleler ve aydınlatma ürünleri gibi parça gruplarını inceleyebilirsiniz. Aradığınız ürünün
              uygunluğundan emin değilseniz, ürün kodu veya araç bilgileriyle bize danışabilirsiniz.
            </p>
          </div>

          {/* Misyon & Vizyon Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4">
                🎯
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Misyonumuz</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Parça arayan sürücü ve ustalara ürün bilgilerini anlaşılır biçimde sunmak; doğru ürünü
                araştırma sürecinde katalog ve doğrudan iletişim kanallarıyla yardımcı olmak.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                🚀
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vizyonumuz</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Oto elektrik ve yedek parça ürünlerini kolayca bulunabilir hale getiren, kullanışlı ve
                güvenilir bir dijital katalog sunmayı sürdürmek.
              </p>
            </div>
          </div>

          {/* Müşterilere sunduğumuz destek */}
          <div className="pt-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-3">
              Size Nasıl Yardımcı Oluyoruz?
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 text-sm">
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Ürün kataloğu:</strong> Soket, kablo, sensör, anahtar, röle ve aydınlatma ürünlerini çevrim içi inceleyebilirsiniz.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Parça sorgulama:</strong> OEM numarası, ürün kodu veya araç bilgileriyle aradığınız parçayı danışabilirsiniz.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Doğrudan iletişim:</strong> Ürün ve sipariş sorularınız için WhatsApp veya telefon üzerinden bize ulaşabilirsiniz.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Farklı alışveriş kanalları:</strong> Ürünlerimizi web kataloğumuzdan ve iletişim sayfamızda yer alan mağazalarımızdan inceleyebilirsiniz.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-900">Aradığınız parçayı bulamadınız mı?</h4>
              <p className="text-sm text-slate-500">OEM kodu, ürün kodu veya araç bilgilerinizle bize danışın.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/iletisim"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Bize Ulaşın
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
              >
                Ürün Kataloğu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}