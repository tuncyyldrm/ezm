import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
          🔍
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          Sayfa Bulunamadı
        </h1>
        
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Aradığınız parça, ürün veya sayfa yayından kaldırılmış, taşınmış ya da bağlantı adresi değişmiş olabilir.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 text-sm"
          >
            Ana Sayfaya ve Kataloğa Dön
          </Link>
          
          <Link
            href="/blog"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-all text-sm"
          >
            Blog Yazılarını Oku
          </Link>
        </div>
      </div>
    </main>
  );
}
