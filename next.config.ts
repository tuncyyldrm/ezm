
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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

