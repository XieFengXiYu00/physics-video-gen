import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["@remotion/renderer", "@remotion/bundler", "@remotion/cli"],
  allowedDevOrigins: [
    "10.109.2.25",
    "10.109.2.25:3001",
    "http://10.109.2.25:3001",
    "localhost:3001",
    "http://localhost:3001",
  ],
};

export default nextConfig;
