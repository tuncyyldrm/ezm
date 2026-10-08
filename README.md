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

Site trafiği için yalnızca Vercel Web Analytics kullanılır; olaylar Supabase'e yazılmaz ve sitede ayrı analiz tablosu/rapor API'si çalıştırılmaz. Vercel projesinde **Analytics > Enable** seçeneğini açıp yeni deployment yapın. İstatistikleri Vercel proje panelindeki **Analytics** bölümünden görüntüleyin. Çerez bildirimi kabul edilmeden ölçüm yüklenmez. Vercel'in Resilient Intake özelliği veri alımını iyileştirse de reklam engelleyicileri tamamen aşma garantisi vermez.

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
