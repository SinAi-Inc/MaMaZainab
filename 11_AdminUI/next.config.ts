import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const publicMediaProtectionHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Robots-Tag", value: "noindex, noarchive, noimageindex" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/partner-portal/assets/*": ["./assets/protected/partners/**/*"],
  },
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: publicMediaProtectionHeaders,
      },
      {
        source: "/uploads/:path*",
        headers: publicMediaProtectionHeaders,
      },
    ];
  },
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
