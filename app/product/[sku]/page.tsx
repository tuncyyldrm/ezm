import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers'; // 🌐 Sayfa URL'ini sunucuda yakalamak için ekledik
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

  // 1. Dinamik olarak o anki sayfa URL'ini sunucu tarafında inşa ediyoruz
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const currentProductUrl = `${protocol}://${host}/product/${sku}`;

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
  const muadilCodes = productCodes.filter((c: any) => c.code_type === 'MUADIL');

  const uniqueVehicles = [...new Set(
    (p.product_vehicles || [])
      .filter((v: any) => v?.brands?.name)
      .map((v: any) => String(v.brands.name))
  )].sort() as string[];

  const category = p.categories;

  // 📝 GELİŞMİŞ WHATSAPP ŞABLONU (Zengin İçerik + Sayfa Linki)
  const WHATSAPP_NUMBER = '905312084897'; // ⚠️ Kendi numaranı ülke koduyla yaz usta
  const firstOem = oemCodes[0]?.code_value ? `\n🔹 *OEM No:* ${oemCodes[0].code_value}` : '';
  const pinText = p.pin_count > 0 ? `\n🔌 *Bağlantı:* ${p.pin_count} PIN` : '';

  const kurumsalMesaj = 
    `👋 Merhaba, bir ürün hakkında bilgi almak istiyorum:\n\n` +
    `📦 *Ürün Kodu (SKU):* ${p.sku}\n` +
    `📝 *Ürün Adı:* ${p.title}` + 
    `${firstOem}` +
    `${pinText}\n\n` +
    `🌐 *Ürün Sayfası:* ${currentProductUrl}`;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(kurumsalMesaj)}`;

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
        {/* Breadcrumb Navigasyonu */}
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
            
            {/* Sol Kısım: Görsel Alanı ve Buton */}
            <div className="flex flex-col items-center justify-between bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 min-h-[460px] border-b md:border-b-0 md:border-r border-gray-100 relative">
              {p.is_new && <span className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">YENİ</span>}
              
              <div className="w-full flex-1 flex items-center justify-center min-h-[280px]">
                <ProductImage sku={p.sku} title={p.title} storageUrl={storageUrl} />
              </div>
              
              {/* ✨ Gelişmiş Premium WhatsApp Butonu */}
              <div className="w-full mt-5 space-y-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-[#25D366] hover:bg-[#20ba56] text-white text-sm font-black rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group select-none relative overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:animate-[shine_0.8s_ease-in-out]" />
                  <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.4 0 11.91 0c3.153.001 6.118 1.23 8.351 3.463 2.233 2.233 3.46 5.199 3.46 8.351-.003 6.557-5.338 11.907-11.85 11.907-.008 0-.013 0-.021 0-2.002-.001-3.97-.53-5.713-1.534L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.312 1.451h.022c5.442 0 9.868-4.426 9.87-9.87.001-2.637-1.03-5.115-2.908-6.993-1.879-1.879-4.357-2.909-6.995-2.91C6.449 1.18 2.022 5.606 2.02 11.049c-.001 1.884.498 3.73 1.442 5.33l-.992 3.623 3.715-.974zm10.154-6.6c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.668.149-.198.297-.766.967-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.174.2-.298.298-.497.099-.198.05-.371-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
                  </svg>
                  <span>Whatsapp Sor</span>
                </a>
                
              </div>
            </div>

            {/* Sağ Kısım: Ürün Detayları */}
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

              {muadilCodes.length > 0 && (
                <div className="mb-6 space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full" /> Bağlı ürünler ({muadilCodes.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                    {muadilCodes.map((muadil: any, idx: number) => {
                      const socketImageUrl = muadil.code_value ? `${storageUrl}/${String(muadil.code_value).trim()}.jpg` : null;
                      return socketImageUrl ? (
                        <SocketImage 
                          key={idx} 
                          src={socketImageUrl} 
                          alt={`Bağlı ürün: ${muadil.code_value}`} 
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