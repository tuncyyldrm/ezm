import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',   // Yönetim panelini taramaya kapatıyoruz
        '/login'    // İsteğe bağlı: Kullanıcı giriş sayfasını da arama sonuçlarında gizlemek isteyebilirsiniz
      ], 
    },
    // Sitemap URL'ini projenizin aktif adresiyle eşitledik
    sitemap: 'https://ezmoto.vercel.app/sitemap.xml',
  };
}