import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Voeg deze regel toe voor betere compatibiliteit met serverless environments
  output: 'standalone', 
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bvalaeywdlqsbzqpeafr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;