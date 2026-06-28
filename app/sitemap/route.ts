// app/sitemap/route.ts
import { NextResponse } from 'next/server';
import { categoryService, supabase } from '@/lib/supabase';

export const revalidate = 21600; // 6 saat cache

function buildXmlSitemap(routes: any[]): string {
  const xmlEntries = routes
    .map(
      (route) => `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${route.lastModified.toISOString()}</lastmod>
      <changefreq>${route.changeFrequency}</changefreq>
      <priority>${route.priority}</priority>
    </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${xmlEntries}
</urlset>`;
}

export async function GET() {
  const baseUrl = 'https://ezmoto.vercel.app';
  
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    // 1. Kategorileri Çek
    const categories = await categoryService.getAll();
    const categoryRoutes = (categories || [])
      .filter((category) => category.slug)
      .map((category) => ({
        url: `${baseUrl}/${category.slug}`,
        lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    // 2. İlk 2500 Ürünü Tek Seferde Çek (Hızlı yanıt ve kesin onay için)
    const { data: products, error } = await supabase
      .from('products')
      .select('sku, is_active, created_at')
      .range(0, 2499);

    if (error) throw error;

    const productRoutes = (products || [])
      .filter((product) => product.sku && product.is_active !== false)
      .map((product) => ({
        url: `${baseUrl}/product/${product.sku}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }));

    const allRoutes = [...staticRoutes, ...categoryRoutes, ...productRoutes];
    const sitemapXml = buildXmlSitemap(allRoutes);

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=21600, s-maxage=21600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Sitemap hatası:', error);
    return new NextResponse(buildXmlSitemap(staticRoutes), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}