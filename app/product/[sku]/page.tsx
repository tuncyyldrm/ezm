import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductImage from '@/components/ProductImage';
import SocketImage from '@/components/SocketImage';
import ProductImageZoom from '@/components/ProductImageZoom';
import Link from 'next/link';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ sku: string }>;
}

// 💡 RESİM UZANTIN NEYSE BURADAN DEĞİŞTİR ('jpg' veya 'png')
const IMAGE_EXTENSION = 'jpg'; 
const STORAGE_URL = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';
const WHATSAPP = '905546588556';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ezmoto.com.tr';

const filterCodes = (codes: any[], type: string) =>
  (codes || []).filter(c => c.code_type === type).map(c => c.code_value);

const uniqueVehicles = (vehicles: any[]) =>
  [...new Set(vehicles?.filter((v: any) => v?.brands?.name).map((v: any) => v.brands.name) || [])].sort();

const whatsappMsg = (sku: string, title: string, pin: number, url: string) =>
  `Merhaba,\n${sku} - ${title} hakkında bilgi almak istiyorum.${pin > 0 ? ` (${pin} PIN)` : ''}\n\n${url}`;

// 🚀 WHATSAPP BOTUNA RESMİ EKSİKSİZ GÖSTEREN KISIM
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { sku } = await params;
  const decoded = decodeURIComponent(sku);
  const url = `${SITE_URL}/product/${encodeURIComponent(sku)}`;

  const { data: p } = await supabase
    .from('products')
    .select('sku, title, pin_count, product_codes(code_value, code_type), categories(name)')
    .eq('sku', decoded)
    .eq('is_active', true)
    .maybeSingle();

  if (!p) return { title: 'Ürün Bulunamadı', robots: { index: false } };

  const oems = filterCodes((p as any).product_codes, 'OEM');
  const kategoriAdi = (p as any).categories?.name || 'Oto Yedek Parça';
  
  // Ürünün tam resim linki oluşturuluyor
  const img = `${STORAGE_URL}/${p.sku}.${IMAGE_EXTENSION}`; 
  const title = `${p.sku} ${p.title} - ${kategoriAdi}`;
  const desc = `${p.sku} SKU kodlu ${p.title} yedek parça. ${p.pin_count ? `${p.pin_count} PIN soket yapısına sahiptir.` : ''}`;

  return {
    title,
    description: desc,
    openGraph: { 
      title, 
      description: desc, 
      url, 
      siteName: 'EZM OTO', 
      locale: 'tr_TR', 
      type: 'article',
      images: [{ url: img, width: 800, height: 800, alt: title }] // Bot resmi buradan vurup alacak
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [img] },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    keywords: `${p.sku}, ${p.title}, ${kategoriAdi}, ${oems.join(', ')}, oto yedek parça, soket, oem no`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { sku } = await params;
  const decoded = decodeURIComponent(sku);
  const url = `${SITE_URL}/product/${encodeURIComponent(sku)}`;

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
  const img = `${STORAGE_URL}/${p.sku}.${IMAGE_EXTENSION}`;
  const whatsapp = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(whatsappMsg(p.sku, p.title, p.pin_count || 0, url))}`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: `${p.sku} - ${p.title}`,
        sku: p.sku,
        image: img,
        description: `${p.title} - EZM OTO Güvencesiyle Kaliteli Oto Yedek Parça çözümleri.`,
        category: p.categories?.name,
        brand: { '@type': 'Brand', name: 'EZM OTO' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock', url: url, seller: { '@type': 'Organization', name: 'EZM OTO' } }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span className="mx-2">/</span>
          {p.categories ? (
            <Link href={`/${p.categories.slug}`} className="hover:text-blue-600">{p.categories.name}</Link>
          ) : (
            <Link href="/urunler" className="hover:text-blue-600">Ürünler</Link>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-semibold" aria-current="page">{p.sku}</span>
        </nav>

        {/* Ürün Kartı */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Sol - Görsel Alanı */}
            <div className="flex flex-col items-center justify-between bg-gradient-to-br from-white-50 to-white p-6 sm:p-8 min-h-[460px] border-b md:border-b-0 md:border-r border-gray-100 relative">
              {p.is_new && <span className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">YENİ ÜRÜN</span>}
              
              <div className="w-full flex-1 flex items-center justify-center min-h-[280px]">
                <ProductImageZoom sku={p.sku} title={`${p.sku} - ${p.title} ${p.categories?.name || ''}`} storageUrl={STORAGE_URL} />
              </div>

              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="w-full mt-3 flex items-center justify-center gap-3 px-5 py-3 bg-[#25D366] hover:bg-[#20ba56] text-white text-sm font-black rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group select-none">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                <span>Fiyat ve Bilgi Al (WhatsApp)</span>
              </a>
            </div>

            {/* Sağ - Detaylar Alanı */}
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 className="text-2xl font-black text-gray-950 bg-gray-100 px-4 py-2 rounded-lg font-mono select-all">
                  <span className="sr-only">Ürün Kodu: </span>{p.sku}
                </h1>
                {p.pin_count > 0 && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">🔌 {p.pin_count} PIN</span>
                )}
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-2">{p.title}</h2>
              
              <p className="text-sm text-gray-600 mb-4 font-normal">
                <strong>{p.sku}</strong> referans numaralı bu unit, yüksek kalite standartlarında üretilmiş bir <strong>{p.categories?.name || 'oto yedek parça'}</strong> ürünüdür.
              </p>

              {p.categories && (
                <Link href={`/${p.categories.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg mb-6 w-fit">
                  📂 {p.categories.name} Kategorisi
                </Link>
              )}

              {/* Muadil Ürünler */}
              {muadils.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full" /> Muadil ve Bağlı Ürün Kodları ({muadils.length})
                  </h3>
                  <span className="sr-only">{muadils.join(', ')}</span>
                  <div className="flex flex-wrap gap-2">
                    {muadils.map((code: string, i: number) => (
                      <SocketImage key={i} src={`${STORAGE_URL}/${code}.${IMAGE_EXTENSION}`} alt={`${code} muadil yedek parça soketi`} socketCode={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* OEM Kodlar */}
              {oems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full" /> Orijinal OEM Numaraları ({oems.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {oems.map((code: string, i: number) => (
                      <span key={i} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg font-mono select-all" title={`${code} orijinal parça numarası`}>{code}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Araçlar */}
              {vehicles.length > 0 && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full" /> Uyumlu Araç Markaları ({vehicles.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {vehicles.map((v: string, i: number) => (
                      <span key={i} className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-100">🚗 {v} Uyumlu</span>
                    ))}
                  </div>
                </div>
              )}

              {!oems.length && !muadils.length && !vehicles.length && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-400 italic">Bu oto soket / parça ürünü için ek çapraz referans kodu bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}