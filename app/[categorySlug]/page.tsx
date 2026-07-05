import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import CategoryClient from '@/components/CategoryClient';
import Link from 'next/link';
import type { Metadata } from 'next';

// 6 saat boyunca sunucu/CDN seviyesinde tam statik cache
export const revalidate = 21600; 

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

const STORAGE_URL = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmoto.vercel.app';

const getBaseUrl = () => SITE_URL;

const normalizeProduct = (p: any) => ({
  ...p,
  pin_count: Number(p.pin_count) || 0,
  product_codes: Array.isArray(p.product_codes) ? p.product_codes : [],
  product_vehicles: Array.isArray(p.product_vehicles) 
    ? p.product_vehicles.filter((v: any) => v?.brands?.name) 
    : []
});

// 🚀 HIZ DOPİNGİ: En popüler kategorileri derleme (build) aşamasında önceden hazırlar
export async function generateStaticParams() {
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .limit(50); // İlk 50 kategoriyi önceden üret

  return (categories || []).map((c) => ({
    categorySlug: c.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug: slug } = await params;
  const currentUrl = `${SITE_URL}/${slug}`;
  
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .maybeSingle();

  if (!category) return { title: 'Kategori Bulunamadı' };

  const categoryImage = `https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images/${slug}.jpg`;

  const title = `${category.name} Yedek Parça`;
  const description = `${category.name} kategorisinde OEM ve muadil oto yedek parçalar.`;

  return {
    title,
    description,
    openGraph: { 
      title, 
      description, 
      url: currentUrl, 
      siteName: 'EZM OTO', 
      type: 'website',
      images: [{ url: categoryImage }] // WhatsApp doğrudan bu adrese vuracak
    },
    twitter: { card: 'summary_large_image', title, description, images: [categoryImage] },
  };
}
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug: slug } = await params;
  const baseUrl = getBaseUrl();
  const currentUrl = `${baseUrl}/${slug}`;

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .eq('slug', slug)
    .maybeSingle();

  if (categoryError || !category) {
    if (categoryError) console.error('Kategori hatası:', categoryError);
    notFound();
  }

  const [subRes, prodRes, parentRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('parent_id', category.id).order('name'),
    
    supabase.from('products')
      .select('id, sku, title, image_url, pin_count, is_new, category_id, product_codes(code_value, code_type), product_vehicles(brands(name))')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('sku', { ascending: true })
      .order('is_new', { ascending: false })
      .order('title', { ascending: true }),

    category.parent_id 
      ? supabase.from('categories').select('id, name, slug').eq('id', category.parent_id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const products = (prodRes.data || []).map(normalizeProduct);
  const subCategories = subRes.data || [];
  const parent = parentRes.data;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${category.name} - Yedek Parça Kategorisi`,
        description: `${category.name} kategorisinde ${products.length} ürün`,
        url: currentUrl,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 20).map((p: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.title,
            sku: p.sku,
            image: p.image_url || `${STORAGE_URL}/${p.sku}.jpg`,
            ...(p.pin_count > 0 && { additionalProperty: { '@type': 'PropertyValue', name: 'PIN', value: p.pin_count } }),
            ...(p.product_codes.length > 0 && {
              identifier: p.product_codes.map((c: any) => ({ '@type': 'PropertyValue', name: c.code_type, value: c.code_value }))
            })
          }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: baseUrl },
          ...(parent ? [{ '@type': 'ListItem', position: 2, name: parent.name, item: `${baseUrl}/${parent.slug}` }] : []),
          { '@type': 'ListItem', position: parent ? 3 : 2, name: category.name, item: currentUrl }
        ]
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-x-1 gap-y-0.5 text-gray-500">
            <li><Link href="/" className="hover:text-blue-600">Ana Sayfa</Link></li>
            {parent && (
              <>
                <li className="mx-1.5 text-gray-300">/</li>
                <li><Link href={`/${parent.slug}`} className="hover:text-blue-600">{parent.name}</Link></li>
              </>
            )}
            <li className="mx-1.5 text-gray-300">/</li>
            <li className="text-gray-900 font-semibold truncate max-w-[250px]" title={category.name}>
              {category.name}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {category.name} Yedek Parçaları
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            <strong>{products.length}</strong> ürün listeleniyor
          </p>
        </header>

        {/* Alt Kategoriler */}
        {subCategories.length > 0 && (
          <nav className="mb-8" aria-label="Alt kategoriler">
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">
              Alt Kategoriler ({subCategories.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {subCategories.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/${sub.slug}`}
                  className="bg-white border border-gray-200 text-sm font-medium px-4 py-2 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Ürün Listesi */}
        <section aria-label={`${category.name} ürünleri`}>
          <CategoryClient categoryName={category.name} products={products} />
        </section>
      </div>
    </main>
  );
}