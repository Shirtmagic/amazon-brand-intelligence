import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.59'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
