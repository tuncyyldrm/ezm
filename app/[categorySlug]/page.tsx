import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import CategoryClient from '@/components/CategoryClient';
import Link from 'next/link';
import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

interface SubCategory {
  id: number;
  name: string;
  slug: string;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug: slug } = await params;
  
  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle();

  if (!category) {
    return {
      title: 'Kategori Bulunamadı',
      description: 'Aradığınız kategori mevcut değil.',
    };
  }

  return {
    title: `${category.name} - EZM Oto Katalog`,
    description: `${category.name} kategorisindeki tüm yedek parça ürünlerini keşfedin. OEM ve muadil seçenekler.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug: slug } = await params;

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle();

  if (categoryError || !category) {
    if (categoryError) console.error('Kategori yüklenirken hata:', categoryError);
    notFound();
  }

  const [subCategoriesRes, productsRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('parent_id', category.id).order('name'),
    supabase.from('products').select(`id, sku, title, image_url, pin_count, is_new, category_id, product_codes(code_value, code_type), product_vehicles(brands(name))`).eq('category_id', category.id).eq('is_active', true).order('id', { ascending: true })
  ]);

  if (productsRes.error) console.error('Ürünler yüklenirken hata:', productsRes.error);

  const products = (productsRes.data || []).map(p => ({
    ...p,
    pin_count: Number(p.pin_count) || 0,
    product_codes: Array.isArray(p.product_codes) ? p.product_codes : [],
    product_vehicles: Array.isArray(p.product_vehicles) ? p.product_vehicles.filter((v: any) => v?.brands?.name) : []
  }));

  const subCategories = (subCategoriesRes.data || []) as SubCategory[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} - EZM Oto Katalog`,
    description: `${category.name} kategorisindeki yedek parça ürünleri`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: p.title, sku: p.sku } }))
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1 flex flex-col">
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-x-1 gap-y-0.5 text-gray-500">
            <li><Link href="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link></li>
            <li aria-hidden="true"><span className="mx-1.5 text-gray-300">/</span></li>
            <li className="text-gray-900 font-semibold truncate max-w-[250px]" title={category.name}>{category.name}</li>
          </ol>
        </nav>

        {subCategories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full" /> Alt Kategoriler ({subCategories.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {subCategories.map(sub => (
                <Link key={sub.id} href={`/${sub.slug}`} className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all">
                  {sub.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex-1 flex flex-col">
          <CategoryClient categoryName={category.name} products={products} />
        </div>
      </div>
    </main>
  );
}