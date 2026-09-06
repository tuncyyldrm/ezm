import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hakkımızda | EZM Oto Yedek Parça & Aksesuar',
  description:
    'EZM Oto Yedek Parça ve Aksesuar; Isparta merkezli, geniş ürün yelpazesi, OEM ve muadil elektrik aksamı, sensör, soket ve aydınlatma ürünleri ile güvenilir çözüm ortağınızdır.',
  keywords: [
    'EZM Oto',
    'Isparta oto yedek parça',
    'oto elektrik soket',
    'oto sensör',
    'OEM yedek parça',
    'EZM Oto Aksesuar'
  ],
  openGraph: {
    title: 'Hakkımızda | EZM Oto Yedek Parça & Aksesuar',
    description:
      'Geniş ürün yelpazemiz ve kaliteli hizmet anlayışımızla otomotiv yedek parça sektöründe yanınızdayız.',
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
            Otomotiv yedek parça ve elektrik aksamında doğru parça, dürüst ticaret ve güvenilir hizmet.
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
              <strong>EZM Oto Yedek Parça & Aksesuar</strong> olarak, Isparta merkezli faaliyet gösteren 
              ve Türkiye genelinde dijital kataloğumuz üzerinden hizmet veren bir otomotiv yedek parça tedarikçisiyiz. 
              Özellikle araç elektrik soketleri, tesisat kabloları, sensörler, anahtarlar, röleler ve aydınlatma 
              grubu gibi hassas ve kritik bileşenlerde geniş ürün stoğumuzla sektöre değer katıyoruz.
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
                Müşterilerimizin ve ustalarımızın aradığı doğru OEM veya muadil parçayı en hızlı şekilde bulmasını sağlamak; 
                şeffaf stok yönetimi, adil fiyat politikası ve güvenli alışveriş deneyimiyle parça tedariğindeki karmaşayı ortadan kaldırmak.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                🚀
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vizyonumuz</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Otomotiv yedek parça ve özellikle oto elektrik soket/sensör alanında Türkiye’nin en kapsamlı, 
                hızlı taranabilir dijital kataloğu ve en güvenilen tedarikçilerinden biri olmak.
              </p>
            </div>
          </div>

          {/* Neden EZM Oto? */}
          <div className="pt-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-3">
              Neden EZM Oto?
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 text-sm">
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Geniş Ürün Çeşidi:</strong> Binlerce OEM referanslı soket, müşür, sensör ve röle çeşidi.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Birebir Uyum:</strong> Araç modellerine özel, denenmiş ve yüksek kaliteli hammaddeye sahip parçalar.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Hızlı İletişim & Destek:</strong> WhatsApp ve telefon üzerinden parça kodu doğrulama ve anında destek.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Isparta İçi Elden / Türkiye Geneli Kargo:</strong> Hem yerel sanayi esnafına hem de tüm illere kesintisiz gönderim.</span>
              </li>
            </ul>
          </div>

          {/* İletişime Geç Butonu */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-900">Aradığınız parçayı bulamadınız mı?</h4>
              <p className="text-sm text-slate-500">Numune veya OEM kodu ile bize danışabilirsiniz.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Kataloğa Göz At
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}