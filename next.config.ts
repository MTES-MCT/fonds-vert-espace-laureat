import type { NextConfig } from "next";

const isTest = process.env.NODE_ENV === "test";

const nextConfig: NextConfig = {
  distDir: isTest ? ".next-test" : ".next",
  experimental: {
    testProxy: isTest,
  },
};

export default nextConfig;
