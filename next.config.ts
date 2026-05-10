import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Proxy /uploads/* to Supabase Storage when a file isn't in public/
  async rewrites() {
    if (!supabaseUrl) return [];
    return [
      {
        source: "/uploads/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
