import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    testProxy: Boolean(process.env.NEXT_TEST_PROXY),
  },
};

export default nextConfig;
