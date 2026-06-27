import { supabase } from '@/lib/supabase';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import CategoryImage from '@/components/CategoryImage';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'EZM OTO - Yedek Parça Kataloğu',
  description: 'OEM ve muadil oto yedek parçalar. Geniş ürün yelpazesi, özel fiyatlar ve hızlı teslimat.',
  openGraph: {
    title: 'EZM OTO - Yedek Parça Kataloğu',
    description: 'OEM ve muadil oto yedek parçalar. Geniş ürün yelpazesi, özel fiyatlar.',
    type: 'website',
  },
};

const STORAGE = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images';
const SITE_URL = 'https://ezmoto.vercel.app';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'EZM OTO',
  url: SITE_URL,
  description: 'Online oto yedek parça kataloğu',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default async function HomePage() {
  const [{ data: categories, error }, { count: totalProducts }] = await Promise.all([
    supabase.from('categories').select('*').is('parent_id', null).order('name'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  if (error) console.error('Kategori hatası:', error);
  const cats = (categories || []) as any[];
  const productCount = totalProducts || 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-900 to-zinc-900 text-white text-center py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/grid.svg)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
<h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-wider text-white mb-2">
            EZM <span className="text-blue-500">OTO</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 font-bold mb-4">
            Yedek Parça Kataloğu
          </p>
          <p className="text-sm text-blue-100/80 max-w-lg mx-auto">
            Orijinal ve muadil parçalar, özel fiyatlar, hızlı teslimat.
          </p>
          
          <div className="flex justify-center gap-10 mt-8">
            <div className="text-center">
              <div className="text-3xl font-black">{cats.length}</div>
              <div className="text-xs text-blue-200 font-medium">Kategori</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black">{productCount.toLocaleString()}</div>
              <div className="text-xs text-blue-200 font-medium">Ürün</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Arama */}
        <section className="relative -mt-6 z-20">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </section>

        {/* Kategoriler */}
        <section className="mt-12">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase">Ürün Kategorileri</h2>
              <p className="text-sm text-gray-500 mt-1">Kategorilere göz atarak ihtiyacınız olan parçayı bulun</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              {cats.length} Grup
            </span>
          </div>

          {cats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {cats.map(cat => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-lg hover:border-blue-300 transition-all min-h-[160px]"
                >
                  <div className="w-16 h-16 flex items-center justify-center mb-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                    <CategoryImage slug={cat.slug} name={cat.name} storageUrl={STORAGE} />
                  </div>
                  <span className="text-xs font-black text-gray-800 uppercase group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border">
              <p className="text-gray-400">Henüz kategori eklenmemiş</p>
            </div>
          )}
        </section>

        {/* SEO Metni */}
        <section className="mt-16 bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Online Oto Yedek Parça Kataloğu</h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            EZM OTO olarak {cats.length}+ kategoride {productCount}+ ürün çeşidimizle hizmetinizdeyiz. 
            Tüm OEM ve muadil yedek parça ihtiyaçlarınız için doğru adrestesiniz. 
            WhatsApp üzerinden hızlı sipariş ve bilgi alabilirsiniz.
          </p>
        </section>
      </div>
    </main>
  );
}