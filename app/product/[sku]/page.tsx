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

interface ProductCode {
  code_value: string;
  code_type: 'OEM' | 'MUADIL';
}

interface Product {
  id: number;
  sku: string;
  title: string;
  pin_count: number;
  is_new: boolean;
  category_id: number;
  categories: { id: number; name: string; slug: string };
  product_codes: ProductCode[];
  product_vehicles: { brands: { name: string } }[];
}

const STORAGE_URL = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';
const WHATSAPP_NUMBER = '905312084897';

const getCurrentUrl = async (sku: string) => {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/product/${sku}`;
};

const filterCodes = (codes: ProductCode[], type: ProductCode['code_type']) => 
  codes.filter(c => c.code_type === type);

const getUniqueVehicles = (vehicles: Product['product_vehicles']) => 
  [...new Set(
    vehicles.filter(v => v?.brands?.name).map(v => v.brands.name)
  )].sort();

// 📱 Basit WhatsApp mesajı - Sadece gerekli bilgiler
const buildWhatsAppMessage = (product: Product, url: string) => {
  const { sku, title, pin_count } = product;
  
  return [
    `Merhaba,`,
    `${sku} - ${title} hakkında bilgi almak istiyorum.`,
    pin_count > 0 && `(${pin_count} PIN)`,
    '',
    url
  ].filter(Boolean).join('\n');
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { sku } = await params;
  
  const { data: product } = await supabase
    .from('products')
    .select('sku, title, pin_count, product_codes(code_value, code_type)')
    .eq('sku', decodeURIComponent(sku))
    .eq('is_active', true)
    .maybeSingle();

  if (!product) return { title: 'Ürün Bulunamadı', description: 'Aradığınız ürün mevcut değil.' };

  const oemCodes = filterCodes((product as any).product_codes || [], 'OEM')
    .map(c => c.code_value).join(', ');

  return {
    title: `${product.sku} - ${product.title}`,
    description: `${product.title} - ${product.pin_count || 0} PIN. OEM: ${oemCodes}`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);
  const currentUrl = await getCurrentUrl(sku);

  const { data: product, error } = await supabase
    .from('products')
    .select(`id, sku, title, pin_count, is_new, category_id, categories!inner(id, name, slug), product_codes(code_value, code_type), product_vehicles(brands(name))`)
    .eq('sku', decodedSku)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !product) {
    console.error('Ürün yüklenirken hata:', error);
    notFound();
  }

  const p = product as unknown as Product;
  const oemCodes = filterCodes(p.product_codes, 'OEM').map(c => c.code_value);
  const muadilCodes = filterCodes(p.product_codes, 'MUADIL');
  const uniqueVehicles = getUniqueVehicles(p.product_vehicles);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(p, currentUrl))}`;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-gray-500">
            <li><Link href="/" className="hover:text-blue-600 font-medium">Ana Sayfa</Link></li>
            <li><span className="mx-2 text-gray-300">/</span></li>
            <li>
              {p.categories ? (
                <Link href={`/${p.categories.slug}`} className="hover:text-blue-600 font-medium">
                  {p.categories.name}
                </Link>
              ) : (
                <Link href="/urunler" className="hover:text-blue-600 font-medium">Ürünler</Link>
              )}
            </li>
            <li><span className="mx-2 text-gray-300">/</span></li>
            <li className="text-gray-900 font-semibold truncate max-w-[250px]" title={p.title}>
              {p.sku}
            </li>
          </ol>
        </nav>

        {/* Ürün Kartı */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Sol - Görsel */}
            <div className="flex flex-col items-center justify-between bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 min-h-[460px] border-b md:border-b-0 md:border-r border-gray-100 relative">
              {p.is_new && (
                <span className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
                  YENİ
                </span>
              )}
              
              <div className="w-full flex-1 flex items-center justify-center min-h-[280px]">
                <ProductImage sku={p.sku} title={p.title} storageUrl={STORAGE_URL} />
              </div>
              
              {/* Basit WhatsApp Butonu */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-5 flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20ba56] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.4 0 11.91 0c3.153.001 6.118 1.23 8.351 3.463 2.233 2.233 3.46 5.199 3.46 8.351-.003 6.557-5.338 11.907-11.85 11.907-.008 0-.013 0-.021 0-2.002-.001-3.97-.53-5.713-1.534L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.312 1.451h.022c5.442 0 9.868-4.426 9.87-9.87.001-2.637-1.03-5.115-2.908-6.993-1.879-1.879-4.357-2.909-6.995-2.91C6.449 1.18 2.022 5.606 2.02 11.049c-.001 1.884.498 3.73 1.442 5.33l-.992 3.623 3.715-.974z"/>
                </svg>
                <span>WhatsApp'tan Sor</span>
              </a>
            </div>

            {/* Sağ - Detaylar */}
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-2xl font-black text-gray-950 bg-gray-100 px-4 py-2 rounded-lg font-mono select-all">
                  {p.sku}
                </span>
                {p.pin_count > 0 && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                    🔌 {p.pin_count} PIN
                  </span>
                )}
              </div>

              <h1 className="text-xl font-semibold text-gray-800 mb-6">{p.title}</h1>

              {p.categories && (
                <Link 
                  href={`/${p.categories.slug}`} 
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg mb-6 w-fit"
                >
                  📂 {p.categories.name}
                </Link>
              )}

              {muadilCodes.length > 0 && (
                <div className="mb-6 space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full" /> 
                    Bağlı ürünler ({muadilCodes.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                    {muadilCodes.map((code, idx) => (
                      <SocketImage 
                        key={idx} 
                        src={`${STORAGE_URL}/${code.code_value}.jpg`} 
                        alt={`Bağlı ürün: ${code.code_value}`} 
                        socketCode={code.code_value} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {oemCodes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full" />
                    OEM ({oemCodes.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {oemCodes.map((code, idx) => (
                      <span 
                        key={idx}
                        className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg font-mono hover:bg-gray-200 transition-all cursor-default select-all"
                        title={code}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {uniqueVehicles.length > 0 && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full" />
                    Araçlar ({uniqueVehicles.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {uniqueVehicles.map((v, idx) => (
                      <span key={idx} className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-100">
                        🚗 {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!oemCodes.length && !muadilCodes.length && !uniqueVehicles.length && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-400 italic">Ek referans bilgisi bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </article>

        <footer className="mt-8 text-center text-xs text-gray-400">
          Ürün Kodu: {p.sku} | ID: {p.id}
        </footer>
      </div>
    </main>
  );
}