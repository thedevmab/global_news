import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // News content is request-time/DB-backed; Cache Components prerender
  // conflicts with Date/DB usage across public layouts. Use path/tag
  // revalidation (revalidatePath / revalidateTag) instead.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i1.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i2.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i3.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i4.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
  },
  async rewrites() {
    return [{ source: "/media/:path*", destination: "/api/media/:path*" }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
