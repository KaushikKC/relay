import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude relay-sdk from Next.js build (it's a separate package)
  // The SDK should be built separately using: cd relay-sdk && npm run build
};

export default nextConfig;
