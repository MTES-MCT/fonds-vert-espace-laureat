import type { NextConfig } from "next";

const isTest = process.env.NODE_ENV === "test";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
  distDir: isTest ? ".next-test" : ".next",
  experimental: {
    testProxy: isTest,
  },
  eslint: {
    dirs: ["src", "tests"],
  },
};

export default nextConfig;
