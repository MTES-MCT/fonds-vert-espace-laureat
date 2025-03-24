import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
  experimental: {
    testProxy: process.env.NODE_ENV === "test",
  },
};

export default nextConfig;
