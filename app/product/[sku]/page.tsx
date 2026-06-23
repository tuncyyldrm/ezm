import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductImage from '@/components/ProductImage';
import SocketImage from '@/components/SocketImage';
import Link from 'next/link';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ sku: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { sku } = await params;
  const { data: product } = await supabase
    .from('products')
    .select('sku, title, pin_count, product_codes(code_value, code_type)')
    .eq('sku', decodeURIComponent(sku))
    .eq('is_active', true)
    .maybeSingle();

  if (!product) return { title: 'Ürün Bulunamadı', description: 'Aradığınız ürün mevcut değil.' };

  const oemCodes = ((product as any).product_codes || [])
    .filter((c: any) => c.code_type === 'OEM')
    .map((c: any) => c.code_value).join(', ');

  return {
    title: `${product.sku} - ${product.title}`,
    description: `${product.title} - ${product.pin_count || 0} PIN. OEM: ${oemCodes}`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);

  const { data: product, error } = await supabase
    .from('products')
    .select(`id, sku, title, pin_count, is_new, category_id, categories!inner(id, name, slug), product_codes(code_value, code_type), product_vehicles(brands(name))`)
    .eq('sku', decodedSku)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !product) { console.error('Ürün yüklenirken hata:', error); notFound(); }

  const p = product as any;
  const storageUrl = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';

  const productCodes = p.product_codes || [];
  const oemCodes = productCodes.filter((c: any) => c.code_type === 'OEM');
  
  // 🛠️ DÜZELTME 1: .find() yerine .filter() kullanarak tüm MUADIL kodlarını topluyoruz usta!
  const muadilCodes = productCodes.filter((c: any) => c.code_type === 'MUADIL');

  const uniqueVehicles = [...new Set(
    (p.product_vehicles || [])
      .filter((v: any) => v?.brands?.name)
      .map((v: any) => String(v.brands.name))
  )].sort() as string[];

  const category = p.categories;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    sku: p.sku,
    category: category?.name || '',
    ...(oemCodes.length > 0 && { identifier: oemCodes.map((c: any) => ({ '@type': 'PropertyValue', name: 'OEM', value: c.code_value })) }),
    ...(p.pin_count > 0 && { additionalProperty: { '@type': 'PropertyValue', name: 'PIN', value: p.pin_count } })
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-4xl mx-auto px-4">
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-gray-500">
            <li><Link href="/" className="hover:text-blue-600 font-medium">Ana Sayfa</Link></li>
            <li><span className="mx-2 text-gray-300">/</span></li>
            <li>
              {category ? (
                <Link href={`/${category.slug}`} className="hover:text-blue-600 font-medium">{category.name}</Link>
              ) : (
                <Link href="/urunler" className="hover:text-blue-600 font-medium">Ürünler</Link>
              )}
            </li>
            <li><span className="mx-2 text-gray-300">/</span></li>
            <li className="text-gray-900 font-semibold truncate max-w-[250px]" title={p.title}>{p.sku}</li>
          </ol>
        </nav>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-8 min-h-[400px] border-b md:border-b-0 md:border-r border-gray-100 relative">
              <ProductImage sku={p.sku} title={p.title} storageUrl={storageUrl} />
              {p.is_new && <span className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">YENİ</span>}
            </div>

            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-2xl font-black text-gray-950 bg-gray-100 px-4 py-2 rounded-lg font-mono select-all">{p.sku}</span>
                {p.pin_count > 0 && <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">🔌 {p.pin_count} PIN</span>}
              </div>

              <h1 className="text-xl font-semibold text-gray-800 mb-6">{p.title}</h1>

              {category && (
                <Link href={`/${category.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg mb-6 w-fit">
                  📂 {category.name}
                </Link>
              )}

              {/* 🛠️ DÜZELTME 2: TÜM BAĞLI ÜRÜNLERİN GÖRSELLERİNİ DÖNGÜYLE LİSTELİYORUZ */}
              {muadilCodes.length > 0 && (
                <div className="mb-6 space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full" /> Soket Tipleri ({muadilCodes.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {muadilCodes.map((muadil: any, idx: number) => {
                      const socketImageUrl = muadil.code_value ? `${storageUrl}/${String(muadil.code_value).trim()}.jpg` : null;
                      return socketImageUrl ? (
                        <SocketImage 
                          key={idx} 
                          src={socketImageUrl} 
                          alt={`Soket: ${muadil.code_value}`} 
                          socketCode={muadil.code_value} 
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {oemCodes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-blue-500 rounded-full" /> OEM ({oemCodes.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {oemCodes.map((code: any, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg font-mono hover:bg-gray-200 transition-all cursor-default select-all" title={code.code_value}>{code.code_value}</span>
                    ))}
                  </div>
                </div>
              )}

              {uniqueVehicles.length > 0 && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-green-500 rounded-full" /> Araçlar ({uniqueVehicles.length})</h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {uniqueVehicles.map((v, idx) => <span key={idx} className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-100">🚗 {v}</span>)}
                  </div>
                </div>
              )}

              {oemCodes.length === 0 && muadilCodes.length === 0 && uniqueVehicles.length === 0 && (
                <div className="mt-auto pt-6 border-t border-gray-100"><p className="text-sm text-gray-400 italic">Ek referans bilgisi bulunmuyor.</p></div>
              )}
            </div>
          </div>
        </article>

        <footer className="mt-8 text-center text-xs text-gray-400">Ürün Kodu: {p.sku} | ID: {p.id}</footer>
      </div>
    </main>
  );
}