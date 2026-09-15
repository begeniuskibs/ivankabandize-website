import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/garden',
        permanent: true,
      },
      {
        source: '/blog/:slug*',
        destination: '/garden/:slug*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
