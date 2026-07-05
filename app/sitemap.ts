import { MetadataRoute } from 'next';
import { categoryService, supabase } from '@/lib/supabase';

// Cache süresini 24 saate çıkararak Vercel zaman aşımı riskini ve Supabase yükünü azaltıyoruz
export const revalidate = 86400; 

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
    // 2. Kategorileri Çek ve Formatla
    const categories = await categoryService.getAll();
    const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
      .filter((category) => category.slug)
      .map((category) => ({
        url: `${baseUrl}/${category.slug}`, // Veritabanındaki orijinal slug neyse o
        lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    // 3. Ürünleri Çek ve Formatla (Aktif olanları doğrudan DB'den filtreleyerek hızı artırıyoruz)
    const { data: products, error } = await supabase
      .from('products')
      .select('sku, created_at')
      .eq('is_active', true)
      .range(0, 9499);

    if (error) throw error;

    const productRoutes: MetadataRoute.Sitemap = (products || [])
      .filter((product) => product.sku)
      .map((product) => ({
        url: `${baseUrl}/product/${product.sku}`, // Karmaşık, büyük/küçük harf orijinal SKU neyse o
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'weekly', // 6600 ürün için ideal tarama sıklığı
        priority: 0.6, // Tarama bütçesi dengesi için ideal öncelik
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];

  } catch (error) {
    console.error('Sitemap üretilirken hata oluştu:', error);
    return staticRoutes;
  }
}