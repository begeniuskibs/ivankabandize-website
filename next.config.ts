import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/services',
        destination: '/workwithme',
        permanent: true,
      },
      {
        source: '/services/:slug*',
        destination: '/workwithme/:slug*',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/me',
        permanent: true,
      },
      {
        source: '/about/:slug*',
        destination: '/me/:slug*',
        permanent: true,
      },
      {
        source: '/auth/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/signup',
        destination: '/signup',
        permanent: true,
      },
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
