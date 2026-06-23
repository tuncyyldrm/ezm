import { supabase, Category } from '@/lib/supabase';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import CategoryImage from '@/components/CategoryImage';

export const revalidate = 3600;

export default async function HomePage() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name');

  if (error) {
    console.error('Kategoriler yüklenirken hata:', error);
  }

  const safeCategories = (categories || []) as Category[];

  const PROJECT_ID = 'erntysmhwfxkrtegirds';
  const categoryStorageUrl = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/product-images`;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white text-center py-12 px-4 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 uppercase">
          EZM OTO KATALOG
        </h1>
        <p className="text-xs md:text-sm text-blue-100 font-medium max-w-md mx-auto">
          Online Yedek Parça. Özel iskonto ve fiyatlarla orijinal, muadil yedek parçalar...
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="relative -mt-6 z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-wider">
              Ürün Kategorileri
            </h2>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {safeCategories.length} Ana Grup
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {safeCategories.map((category) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md hover:border-blue-400 transition-all group cursor-pointer min-h-[150px]"
              >
                <div className="w-16 h-16 flex items-center justify-center mb-4 bg-gray-50 rounded-xl group-hover:scale-105 transition-transform">
                  <CategoryImage 
                    slug={category.slug} 
                    name={category.name} 
                    storageUrl={categoryStorageUrl} 
                  />
                </div>
                <span className="text-[11px] font-black text-blue-950 uppercase tracking-wider leading-tight group-hover:text-blue-600 transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}