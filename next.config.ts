import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Google script kütüphanesini maskeli isimle çekiyoruz
        source: '/assets/js/core-system.js',
        destination: 'https://www.googletagmanager.com/gtag/js', 
      },
      {
        // AdBlocker'ların asla şüphelenmeyeceği bir isim
        // Gelen tüm parametreleri (?) arka planda sansürsüz Google'a paslıyoruz
        source: '/api/v1/internal-status',
        destination: 'https://www.google-analytics.com/g/collect',
      },
    ];
  },
};

export default nextConfig;