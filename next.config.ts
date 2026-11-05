import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Lets a phone on the same Wi-Fi open the dev server by the laptop's IP (e.g. http://192.168.1.11:3000).
  allowedDevOrigins: ["192.168.*.*"],
  // 92 is used for the leadership portraits, which visibly break up at the default 75.
  images: { qualities: [75, 92] },
  partialPrefetching: true,
  // The quotation PDF is rendered on the server and reads its images from public/pdf at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: { "/api/quotations/**": ["./public/pdf/**"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
