import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default nextConfig;
