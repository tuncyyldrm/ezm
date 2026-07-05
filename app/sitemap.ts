import { MetadataRoute } from 'next';
import { categoryService, supabase } from '@/lib/supabase';

export const revalidate = 86400; // 24 saat cache

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ezmoto.vercel.app';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  try {
    // 1. Kategorileri Çek
    const categories = await categoryService.getAll();
    const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
      .filter((category) => category.slug)
      .map((category) => ({
        url: `${baseUrl}/${category.slug}`,
        lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    // 2. TÜM Ürünleri Sayfalayarak Çek (Supabase 1000 limitini aşmak için)
    let allProducts: any[] = [];
    let page = 0;
    const pageSize = 1000; // Her istekte çekilecek maksimum satır sayısı
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: products, error } = await supabase
        .from('products')
        .select('sku, created_at')
        .eq('is_active', true)
        .range(from, to);

      if (error) throw error;

      if (products && products.length > 0) {
        allProducts = [...allProducts, ...products];
        // Eğer gelen veri pageSize'dan azsa, çekilecek başka ürün kalmamıştır
        if (products.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    // 3. Ürün Sayfalarını Formatla
    const productRoutes: MetadataRoute.Sitemap = allProducts
      .filter((product) => product.sku)
      .map((product) => ({
        url: `${baseUrl}/product/${product.sku}`, // Karışık/büyük/küçük harf orijinal SKU
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];

  } catch (error) {
    console.error('Sitemap üretilirken hata oluştu:', error);
    return staticRoutes;
  }
}