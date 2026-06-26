import { MetadataRoute } from 'next';
import { categoryService, supabase } from '@/lib/supabase'; // productService yerine doğrudan supabase çağıracağız
export const revalidate = 21600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ezmoto.vercel.app';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    // 1. Kategorileri Çek (Kategorileriniz 43 adet olduğu için 1000 limitine takılmaz)
    const categories = await categoryService.getAll();

    // 2. Tüm Ürünleri Döngüyle Çek (Supabase 1000 Limitini Aşmak İçin)
    let allProducts: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Sadece sitemap için gerekli olan alanları çekerek performansı artırıyoruz
      const { data, error } = await supabase
        .from('products')
        .select('sku, is_active, created_at')
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        allProducts = [...allProducts, ...data];
        page++;
        // Eğer gelen veri pageSize'dan azsa, çekilecek başka ürün kalmamıştır
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    // 3. Kategorileri Haritalandır
    const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
      .filter(category => category.slug)
      .map((category) => ({
        url: `${baseUrl}/${category.slug}`,
        lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    // 4. Ürünleri Haritalandır (Artık 6.599 ürünün tamamı burada)
    const productRoutes: MetadataRoute.Sitemap = allProducts
      .filter(product => product.sku && product.is_active !== false)
      .map((product) => ({
        url: `${baseUrl}/product/${product.sku}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];

  } catch (error) {
    console.error('Sitemap oluşturulurken bir hata meydana geldi:', error);
    return staticRoutes;
  }
}