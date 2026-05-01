import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["@remotion/renderer", "@remotion/bundler", "@remotion/cli"],
};

export default nextConfig;
