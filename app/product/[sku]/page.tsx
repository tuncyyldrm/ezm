import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import ProductImage from '@/components/ProductImage';
import SocketImage from '@/components/SocketImage';
import Link from 'next/link';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ sku: string }>;
}

// 📦 Sabitler
const STORAGE_URL = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';
const WHATSAPP = '905312084897';

// 🔧 Yardımcılar
const getBaseUrl = async () => {
  const heads = await headers();
  const host = heads.get('host') || 'localhost:3000';
  return `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`;
};

const filterCodes = (codes: any[], type: string) =>
  (codes || []).filter(c => c.code_type === type).map(c => c.code_value);

const uniqueVehicles = (vehicles: any[]) =>
  [...new Set(vehicles?.filter((v: any) => v?.brands?.name).map((v: any) => v.brands.name) || [])].sort();

const whatsappMsg = (sku: string, title: string, pin: number, url: string) =>
  `Merhaba,\n${sku} - ${title} hakkında bilgi almak istiyorum.${pin > 0 ? ` (${pin} PIN)` : ''}\n\n${url}`;

// 🏷️ SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { sku } = await params;
  const decoded = decodeURIComponent(sku);
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/product/${sku}`;

  const { data: p } = await supabase
    .from('products')
    .select('sku, title, pin_count, product_codes(code_value, code_type)')
    .eq('sku', decoded)
    .eq('is_active', true)
    .maybeSingle();

  if (!p) return { title: 'Ürün Bulunamadı', robots: { index: false } };

  const oems = filterCodes((p as any).product_codes, 'OEM');
  const img = `${STORAGE_URL}/${p.sku}.jpg`;
  const title = `${p.sku} - ${p.title} | EZM OTO`;
  const desc = `${p.title}. ${p.pin_count || 0} PIN. OEM: ${oems.join(', ')}. Hızlı teslimat.`;

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url, siteName: 'EZM OTO', images: [{ url: img, width: 800, height: 600, alt: title }], locale: 'tr_TR', type: 'website' },
    twitter: { card: 'summary_large_image', title, description: desc, images: [img] },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    keywords: `${p.sku}, ${p.title}, ${oems.join(', ')}, oto yedek parça`,
  };
}

// 📄 Sayfa
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { sku } = await params;
  const decoded = decodeURIComponent(sku);
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/product/${sku}`;

  const { data: product, error } = await supabase
    .from('products')
    .select('id, sku, title, pin_count, is_new, category_id, categories!inner(id, name, slug), product_codes(code_value, code_type), product_vehicles(brands(name))')
    .eq('sku', decoded)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !product) { console.error(error); notFound(); }

  const p = product as any;
  const oems = filterCodes(p.product_codes, 'OEM');
  const muadils = filterCodes(p.product_codes, 'MUADIL');
  const vehicles = uniqueVehicles(p.product_vehicles);
  const img = `${STORAGE_URL}/${p.sku}.jpg`;
  const whatsapp = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(whatsappMsg(p.sku, p.title, p.pin_count || 0, url))}`;

  // Schema.org
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: p.title,
        sku: p.sku,
        image: img,
        description: `${p.title}${p.pin_count > 0 ? ` - ${p.pin_count} PIN` : ''}`,
        category: p.categories?.name,
        ...(oems.length > 0 && { identifier: oems.map((o: string) => ({ '@type': 'PropertyValue', name: 'OEM', value: o })) }),
        ...(p.pin_count > 0 && { additionalProperty: { '@type': 'PropertyValue', name: 'PIN', value: p.pin_count } }),
        offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', priceCurrency: 'TRY', seller: { '@type': 'Organization', name: 'EZM OTO' } }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: p.categories?.name || 'Ürünler', item: p.categories ? `${baseUrl}/${p.categories.slug}` : `${baseUrl}/urunler` },
          { '@type': 'ListItem', position: 3, name: p.sku, item: url }
        ]
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span className="mx-2">/</span>
          {p.categories ? (
            <Link href={`/${p.categories.slug}`} className="hover:text-blue-600">{p.categories.name}</Link>
          ) : (
            <Link href="/urunler" className="hover:text-blue-600">Ürünler</Link>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-semibold">{p.sku}</span>
        </nav>

        {/* Ürün Kartı */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Sol - Görsel */}
            <div className="flex flex-col items-center justify-between bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 min-h-[460px] border-b md:border-b-0 md:border-r border-gray-100 relative">
              {p.is_new && (
                <span className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">YENİ</span>
              )}
              
              <div className="w-full flex-1 flex items-center justify-center min-h-[280px]">
                <ProductImage sku={p.sku} title={p.title} storageUrl={STORAGE_URL} />
              </div>

              {/* WhatsApp Butonu */}
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-5 flex items-center justify-center gap-3 px-5 py-4 bg-[#25D366] hover:bg-[#20ba56] text-white text-sm font-black rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group select-none"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.4 0 11.91 0c3.153.001 6.118 1.23 8.351 3.463 2.233 2.233 3.46 5.199 3.46 8.351-.003 6.557-5.338 11.907-11.85 11.907-.008 0-.013 0-.021 0-2.002-.001-3.97-.53-5.713-1.534L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.312 1.451h.022c5.442 0 9.868-4.426 9.87-9.87.001-2.637-1.03-5.115-2.908-6.993-1.879-1.879-4.357-2.909-6.995-2.91C6.449 1.18 2.022 5.606 2.02 11.049c-.001 1.884.498 3.73 1.442 5.33l-.992 3.623 3.715-.974z"/>
                </svg>
                <span>Whatsapp Sor</span>
              </a>
            </div>

            {/* Sağ - Detaylar */}
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 className="text-2xl font-black text-gray-950 bg-gray-100 px-4 py-2 rounded-lg font-mono select-all">{p.sku}</h1>
                {p.pin_count > 0 && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">🔌 {p.pin_count} PIN</span>
                )}
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-4">{p.title}</h2>

              {p.categories && (
                <Link href={`/${p.categories.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg mb-6 w-fit">
                  📂 {p.categories.name}
                </Link>
              )}

              {/* Muadil Ürünler */}
              {muadils.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full" /> Bağlı Ürünler ({muadils.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {muadils.map((code: string, i: number) => (
                      <SocketImage key={i} src={`${STORAGE_URL}/${code}.jpg`} alt={code} socketCode={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* OEM Kodlar */}
              {oems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full" /> OEM ({oems.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {oems.map((code: string, i: number) => (
                      <span key={i} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg font-mono select-all">{code}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Araçlar */}
              {vehicles.length > 0 && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full" /> Uyumlu Araçlar ({vehicles.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {vehicles.map((v: string, i: number) => (
                      <span key={i} className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-100">🚗 {v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Boş durum */}
              {!oems.length && !muadils.length && !vehicles.length && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-400 italic">Ek referans bilgisi bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}