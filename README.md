# EZM OTO

EZM OTO, otomotiv yedek parça kataloğu için Next.js App Router, React ve Supabase kullanan bir web uygulamasıdır.

## Geliştirme

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır. Gerekli Supabase ortam değişkenlerini `.env.local` dosyasında tanımlayın.

## Push bildirimlerini yapılandırma

Push bildirimleri, izin veren ziyaretçilere indirim ve duyuruları tarayıcı/cihaz bildirimi olarak gönderir. Gönderimleri admin panelindeki **Bildirimler** sayfasından yapabilirsiniz.

1. Supabase SQL Editor'da [`scripts/push-notifications.sql`](./scripts/push-notifications.sql) içeriğini çalıştırın.
2. VAPID anahtarlarını üretin:

   ```bash
   npx web-push generate-vapid-keys
   ```

3. `.env.local` dosyanıza aşağıdaki değerleri ekleyin. VAPID private key ile Supabase service-role key yalnızca sunucuda tutulmalıdır; `NEXT_PUBLIC_` öneki eklemeyin.

   ```env
   NEXT_PUBLIC_SITE_URL=https://ezmoto.com.tr
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=
   VAPID_PRIVATE_KEY=
   VAPID_SUBJECT=mailto:info@ezmoto.com.tr
   ```

   Değişken adları için [`.env.example`](./.env.example) dosyasına da bakabilirsiniz.

4. Aynı ortam değişkenlerini üretim ortamına ekleyip siteyi HTTPS üzerinden yayınlayın. Bildirim gönderen kullanıcı Supabase `app_metadata.role` alanında `admin` rolüne sahip olmalıdır.
5. Ziyaretçiler sayfa altındaki **Bildirimleri Aç** düğmesiyle açıkça izin verebilir; aboneliklerini aynı alandan kapatabilir. iPhone/iPad'de Web Push için siteyi önce Safari üzerinden ana ekrana eklemek gerekir.

Admin gönderim aracı site içi adresleri ve Instagram gibi HTTPS dış bağlantıları kabul eder. HTTP, JavaScript ve protokol-göreli bağlantılara izin verilmez. Bildirim tıklandığında site içi sayfa uygulamada açılır; dış bağlantı tarayıcıda yeni bir sekme/pencere olarak açılır.

## Site analizini yapılandırma

Site ölçümü Google Analytics 4 (GA4) ile yapılır. Ölçüm kodu yalnızca ziyaretçi çerez bilgilendirmesinde **Kabul Et** seçtikten sonra yüklenir; reddeden ziyaretçiler ölçülmez. Admin panelindeki **Site Analizi** raporu gerçek zamanlı aktif kullanıcıları (30 saniyede bir), günlük görüntüleme/kullanıcı/oturumları, en çok görüntülenen 50 sayfayı, ürün detay sayfası performansını, cihazları, ülkeleri, trafik kaynaklarını, tarayıcıları ve etkinlikleri gösterir.

Kurulum:

1. Google Analytics'te bir GA4 mülkü ve web veri akışı oluşturun. Web akışındaki Measurement ID'yi (`G-...`) `NEXT_PUBLIC_GA_MEASUREMENT_ID` olarak tanımlayın. Eski `GA_MEASUREMENT_ID` değişkeni de geçiş kolaylığı için desteklenir.
2. Google Cloud Console'da bir proje oluşturup **Google Analytics Data API**'yi etkinleştirin. Bir servis hesabı ve JSON anahtarı oluşturun.
3. Servis hesabı e-posta adresini GA4 mülkünün **Mülk erişim yönetimi** bölümüne **Görüntüleyen (Viewer)** rolüyle ekleyin.
4. GA4 mülk numarasını (Measurement ID değil, sayısal Property ID) `GA_PROPERTY_ID`, servis hesabı e-postasını `GA_SERVICE_ACCOUNT_EMAIL` ve JSON anahtarındaki `private_key` değerini `GA_SERVICE_ACCOUNT_PRIVATE_KEY` olarak dağıtım ortamına ekleyin. Özel anahtar sunucu tarafında kalmalıdır; `NEXT_PUBLIC_` öneki kullanmayın veya anahtarı Git'e eklemeyin. Vercel'e girerken satır sonlarını koruyun ya da `\n` biçiminde girin.
5. Değişkenleri Vercel'de Production ortamına ekleyip yeniden dağıtım yapın. Rapor verileri GA4'te işlenme süresi nedeniyle gecikmeli görünebilir.

GA4 Data API raporu yalnızca oturum açmış adminlere sunulur. Admin raporunda bugün, son 7/30 gün veya en fazla 366 günlük özel tarih aralığı seçilebilir; özel ve günlük raporlar eşit uzunluktaki önceki dönemle karşılaştırılır. Ölçüm reklam engelleyiciler veya tarayıcı ayarları tarafından engellenebilir.

Önceden `scripts/site-analytics.sql` çalıştırıp eski Supabase analiz tablosunu oluşturduysanız, artık kullanılmayacağı için isteğe bağlı olarak Supabase SQL Editor'da şu temizliği uygulayabilirsiniz (bu işlem eski analiz verilerini siler):

```sql
drop function if exists public.get_site_analytics(timestamptz, timestamptz);
drop table if exists public.site_analytics_events;
```

## Komutlar

```bash
npm run lint
npm run build
```
