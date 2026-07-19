import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Portfolio uploads: up to 10 images at 10MB each go through a Server
      // Action (saveWork); the default limit is 1MB.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
