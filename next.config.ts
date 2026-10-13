
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 gün önbellek
    remotePatterns: [
      {
        protocol: "https",
        hostname: "erntysmhwfxkrtegirds.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /* Diğer ayarlarınız */
};

export default nextConfig;

