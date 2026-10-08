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
        Son Güncelleme: 06 Eylül 2026
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
            Sitemiz, analiz tercihinizi tarayıcınızın yerel depolama alanında hatırlar. İzin vermeniz halinde Vercel Web Analytics anonim ve toplulaştırılmış site kullanım istatistikleri üretir. Google Analytics veya Supabase tabanlı ziyaret analizi kullanılmaz.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Tercih kaydı:</strong> “Kabul Et” veya “Reddet” seçiminiz tarayıcınızda saklanır; bu kayıt analiz ölçümü yapmaz.
            </li>
            <li>
              <strong>Analitik ölçüm:</strong> Yalnızca “Kabul Et” seçiminizden sonra yüklenir. “Reddet” seçerseniz analitik yüklenmez. Ölçüm, reklam engelleyiciler veya tarayıcı ayarları tarafından engellenebilir.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            3. Çerez Tercihlerinizi Nasıl Yönetebilirsiniz?
          </h2>
          <p className="mb-3">
            Analitik tercihinizi ilk ziyarette çıkan bilgilendirme bandından belirleyebilirsiniz. Tercihi değiştirmek için tarayıcı depolama alanındaki site verilerini silebilirsiniz; sonraki ziyarette seçim bandı yeniden gösterilir.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Tarayıcı ayarlarınızdan site verilerini silebilir veya ölçümü engelleyebilirsiniz.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4. Push Bildirimleri
          </h2>
          <p className="mb-3">
            Bildirimler yalnızca ilgili düğme üzerinden izin veren ziyaretçilere gönderilir. Abonelik
            sırasında tarayıcının oluşturduğu cihaz bildirim adresi ve teknik anahtarlar, kampanya ve
            site duyurularını iletmek amacıyla Supabase altyapısında saklanır. Bildirim başlığı, mesajı
            ve bağlantısı tarayıcınızın push hizmeti üzerinden cihazınıza ulaştırılır.
          </p>
          <p>
            Bildirim aboneliğinizi site altındaki <strong>Bildirimleri Kapat</strong> düğmesiyle
            kaldırabilirsiniz. Abonelik kaldırıldığında kayıtlı cihaz adresi sistemimizden silinir.
            Tarayıcı veya cihaz ayarlarından bildirim iznini kapatmanız da mümkündür.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            5. İletişim
          </h2>
          <p>
            Çerez politikamız veya KVKK kapsamındaki haklarınızla ilgili her türlü soru, görüş ve önerileriniz için bizimle doğrudan web sitemizde yer alan iletişim kanalları üzerinden irtibata geçebilirsiniz.
          </p>
        </section>
      </div>
    </main>
  );
}