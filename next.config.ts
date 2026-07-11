import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Tarayıcı bu adrese istek atacak (Eklentiler bunu kendi sitenin bir parçası sanır)
        source: '/analiz-sistemi/:path*',
        // Arka planda Vercel bu isteği çaktırmadan Google'a iletecek
        destination: 'https://www.googletagmanager.com/:path*',
      },
      {
        // Verilerin toplandığı analiz sunucusunu maskeliyoruz
        source: '/analiz-veri/:path*',
        destination: 'https://www.google-analytics.com/:path*',
      },
    ];
  },
};

export default nextConfig;