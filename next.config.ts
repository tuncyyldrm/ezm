import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // GTM script dosyasını (gtm.js) çekmek için proxy
        source: '/analiz-sistemi/:path*',
        destination: 'https://www.googletagmanager.com/:path*',
      },
      {
        // GA4 veri gönderme (collect) isteklerini yönlendirmek için proxy
        source: '/analiz-veri/:path*',
        destination: 'https://www.google-analytics.com/:path*',
      },
    ];
  },
};

export default nextConfig;