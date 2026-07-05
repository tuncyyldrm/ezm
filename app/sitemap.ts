import { MetadataRoute } from 'next';
import { categoryService, supabase } from '@/lib/supabase';

export const revalidate = 21600; // 6 saat cache

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ezmoto.vercel.app';

  // 1. Statik Rotalar (Engellenen /login kaldırıldı)
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
        url: `${baseUrl}/${category.slug}`,
        lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    // 3. Ürünleri Çek ve Formatla (İlk 2500 ürün)
    const { data: products, error } = await supabase
      .from('products')
      .select('sku, is_active, created_at')
      .range(0, 9499);

    if (error) throw error;

    const productRoutes: MetadataRoute.Sitemap = (products || [])
      .filter((product) => product.sku && product.is_active !== false)
      .map((product) => ({
        url: `${baseUrl}/product/${product.sku}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];

  } catch (error) {
    console.error('Sitemap üretilirken hata oluştu:', error);
    // Hata anında sitenin çökmemesi için sadece ana sayfayı güvenli liman olarak dönüyoruz
    return staticRoutes;
  }
}