import React from 'react';

export const metadata = {
  title: 'Çerez Politikası | EZM OTO',
  description: 'EZM OTO yedek parça kataloğu web sitesi çerez politikası ve aydınlatma metni.',
};

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:py-20 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        Çerez Politikası
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Son Güncelleme: 11 Temmuz 2026
      </p>

      <hr className="my-8 border-gray-200 dark:border-gray-800" />

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            1. Çerez (Cookie) Nedir?
          </h2>
          <p>
            Çerezler, bir web sitesini ziyaret ettiğinizde bilgisayarınızda veya mobil cihazınızda (akıllı telefon, tablet gibi) depolanan küçük salt metin dosyalarıdır. Bu dosyalar, sitemizi daha verimli kullanabilmeniz ve kişiselleştirilmiş bir deneyim yaşayabilmeniz adına tarayıcınız tarafından saklanır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            2. Hangi Çerezleri Ne Amaçla Kullanıyoruz?
          </h2>
          <p className="mb-3">
            Web sitemizde yalnızca yasal mevzuata uygun, sınırlı ve belirli amaçlar doğrultusunda çerezler kullanılmaktadır:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Zorunlu Çerezler:</strong> Web sitesinin temel fonksiyonlarını yerine getirebilmesi, oturum güvenliğinin sağlanması ve çerez tercihinizin hatırlanması için zorunlu olan teknik çerezlerdir.
            </li>
            <li>
              <strong>Analitik ve Performans Çerezleri:</strong> Sitemizi kaç kişinin ziyaret ettiğini, hangi sayfaların daha çok görüntülendiğini ve kullanıcı hareketlerini anonim (isimsiz) olarak analiz ederek sistem performansını iyileştirmek amacıyla kullanılan birinci taraf istatistik çerezleridir (Google Analytics entegrasyonu dahil).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            3. Çerez Tercihlerinizi Nasıl Yönetebilirsiniz?
          </h2>
          <p className="mb-3">
            Ziyaretçilerimizin kişisel verileri üzerindeki tercih hakları bizim için esastır. Çerezlere dair tercihlerinizi yönetmek için şu yolları kullanabilirsiniz:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Sitemize ilk girişinizde karşınıza çıkan <strong>Çerez Onay Bandı</strong> üzerinden isteklerinizi "Kabul Et" veya "Reddet" şeklinde tek tıkla belirtebilirsiniz.
            </li>
            <li>
              Kullandığınız internet tarayıcısının (Google Chrome, Safari, Microsoft Edge vb.) ayarlar kısmından daha önce kaydedilmiş çerezleri silebilir veya gelecekte çerez kaydedilmesini tamamen engelleyebilirsiniz.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4. İletişim
          </h2>
          <p>
            Çerez politikamız veya KVKK kapsamındaki haklarınızla ilgili her türlü soru, görüş ve önerileriniz için bizimle doğrudan web sitemizde yer alan iletişim kanalları üzerinden irtibata geçebilirsiniz.
          </p>
        </section>
      </div>
    </main>
  );
}