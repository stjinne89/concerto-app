import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https', // <--- Hier mag ALLEEN 'https' staan
        hostname: 'bvalaeywdlqsbzqpeafr.supabase.co', // <--- Hier jouw Supabase domein (zonder https://)
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;