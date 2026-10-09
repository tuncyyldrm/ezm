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

Site ölçümü Google Analytics 4 (GA4) ile yapılır. Ölçüm kodu yalnızca ziyaretçi çerez bilgilendirmesinde **Kabul Et** seçtikten sonra yüklenir; reddeden ziyaretçiler ölçülmez. Admin panelindeki **Site Analizi** raporu günlük görüntüleme/kullanıcı/oturumları, GA4 API sınırına kadar sayfa ve ürün detay performansını (arama dahil), cihazları, ülkeleri, trafik kaynaklarını, tarayıcıları ve etkinlikleri gösterir. GA4 mülkünün yalnızca EZM OTO'ya ait olduğu doğrulandıktan sonra canlı aktif kullanıcı raporu da etkinleştirilebilir.

Kurulum:

1. EZM OTO için ayrı bir GA4 mülkü ve web veri akışı oluşturun. Memonex3D'nin Measurement ID'sini, GA4 Property ID'sini veya servis hesabını EZM OTO ile paylaşmayın. Web akışındaki Measurement ID'yi (`G-...`) `NEXT_PUBLIC_GA_MEASUREMENT_ID` olarak tanımlayın. Eski `GA_MEASUREMENT_ID` değişkeni kullanılmaz.
2. Google Cloud Console'da bir proje oluşturup **Google Analytics Data API**'yi etkinleştirin. Bir servis hesabı ve JSON anahtarı oluşturun.
3. Servis hesabı e-posta adresini GA4 mülkünün **Mülk erişim yönetimi** bölümüne **Görüntüleyen (Viewer)** rolüyle ekleyin.
4. GA4 mülk numarasını (Measurement ID değil, sayısal Property ID) `GA_PROPERTY_ID`, servis hesabı e-postasını `GA_SERVICE_ACCOUNT_EMAIL` ve JSON anahtarındaki `private_key` değerini `GA_SERVICE_ACCOUNT_PRIVATE_KEY` olarak dağıtım ortamına ekleyin. Ayrıca üretim alan adını `GA_HOSTNAME` olarak girin (ör. `ezmoto.com.tr`); admin rapor sorguları bu host adına göre filtrelenir. Özel anahtar sunucu tarafında kalmalıdır; `NEXT_PUBLIC_` öneki kullanmayın veya anahtarı Git'e eklemeyin. Vercel'e girerken satır sonlarını koruyun ya da `\n` biçiminde girin.
5. Değişkenleri Vercel'de Production ortamına ekleyip yeniden dağıtım yapın. Rapor verileri GA4'te işlenme süresi nedeniyle gecikmeli görünebilir.

GA4 Data API raporu yalnızca oturum açmış adminlere sunulur. Admin raporunda bugün, son 7/30 gün veya en fazla 366 günlük özel tarih aralığı seçilebilir; raporlar `GA_HOSTNAME` host adıyla sınırlandırılır, `/admin` ve `/admin/...` sayfaları hariç tutulur ve önceki eşit uzunluktaki dönemle karşılaştırılır. Google Analytics arayüzünde karşılaştırma yaparken aynı host ve sayfa yolu filtrelerini uygulayın. Canlı rapor varsayılan olarak kapalıdır; yalnızca `GA_PROPERTY_ID` EZM OTO'ya özel bir mülke ait olduğu ve GA4'te admin trafiğinin hariç tutulduğu doğrulandıktan sonra hem `GA_REALTIME_ENABLED=true` hem `GA_REALTIME_PUBLIC_ONLY=true` yapın. Paylaşılan GA4 mülklerinde canlı kullanıcı sayısı siteler veya admin/ziyaretçi trafiği arasında güvenilir biçimde ayrıştırılamayabilir. Rapor verileri ziyaretçinin GA4 ölçümünü kabul etmesine ve Google Analytics'in veriyi işlemesine bağlıdır; reklam engelleyiciler veya tarayıcı ayarları ölçümü engelleyebilir.

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
