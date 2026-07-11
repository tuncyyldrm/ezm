import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // GTM script dosyalarını çekmek için proxy
        source: '/analiz-sistemi/:path*',
        destination: 'https://www.googletagmanager.com/:path*',
      },
      {
        // 🚀 ÇÖZÜM: Verilerin gönderildiği (collect) endpoint'i güncel Google API sunucusuna yönlendiriyoruz
        source: '/analiz-veri/:path*',
        destination: 'https://analytics.google.com/:path*',
      },
    ];
  },
};

export default nextConfig;