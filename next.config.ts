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
      // Ghost post stream redirects
      {
        source: '/randomthoughts/:slug',
        destination: '/garden/:slug',
        permanent: true,
      },
      {
        source: '/structuredthoughts/:slug',
        destination: '/garden/:slug',
        permanent: true,
      },
      {
        source: '/toolsforthought/:slug',
        destination: '/garden/:slug',
        permanent: true,
      },
      // Ghost retired books section redirects
      {
        source: '/books',
        destination: '/garden',
        permanent: true,
      },
      {
        source: '/books/:path*',
        destination: '/garden',
        permanent: true,
      },
      // Ghost tag redirects - Streams
      {
        source: '/tag/random-thoughts',
        destination: '/random-thoughts',
        permanent: true,
      },
      {
        source: '/tag/random-thoughts/:path*',
        destination: '/random-thoughts',
        permanent: true,
      },
      {
        source: '/tag/structured-thoughts',
        destination: '/structured-thoughts',
        permanent: true,
      },
      {
        source: '/tag/structured-thoughts/:path*',
        destination: '/structured-thoughts',
        permanent: true,
      },
      {
        source: '/tag/tools-for-thought',
        destination: '/tools-for-thought',
        permanent: true,
      },
      {
        source: '/tag/tools-for-thought/:path*',
        destination: '/tools-for-thought',
        permanent: true,
      },
      // Ghost tag redirects - Series
      {
        source: '/tag/30in30-series',
        destination: '/garden/series/30in30',
        permanent: true,
      },
      {
        source: '/tag/30in30-series/:path*',
        destination: '/garden/series/30in30',
        permanent: true,
      },
      // Ghost tag redirects - Retired / non-existing tags to /garden
      {
        source: '/tag/books',
        destination: '/garden',
        permanent: true,
      },
      {
        source: '/tag/books/:path*',
        destination: '/garden',
        permanent: true,
      },
      {
        source: '/tag/no-code',
        destination: '/garden',
        permanent: true,
      },
      {
        source: '/tag/no-code/:path*',
        destination: '/garden',
        permanent: true,
      },
      {
        source: '/tag/podcasts',
        destination: '/garden',
        permanent: true,
      },
      {
        source: '/tag/podcasts/:path*',
        destination: '/garden',
        permanent: true,
      },
      // Ghost tag redirects - Real non-internal tags
      {
        source: '/tag/artificial-intelligence',
        destination: '/garden/topics/artificial-intelligence',
        permanent: true,
      },
      {
        source: '/tag/artificial-intelligence/:path*',
        destination: '/garden/topics/artificial-intelligence',
        permanent: true,
      },
      {
        source: '/tag/business',
        destination: '/garden/topics/business',
        permanent: true,
      },
      {
        source: '/tag/business/:path*',
        destination: '/garden/topics/business',
        permanent: true,
      },
      {
        source: '/tag/faith',
        destination: '/garden/topics/faith',
        permanent: true,
      },
      {
        source: '/tag/faith/:path*',
        destination: '/garden/topics/faith',
        permanent: true,
      },
      {
        source: '/tag/genai-leader',
        destination: '/garden/topics/genai-leader',
        permanent: true,
      },
      {
        source: '/tag/genai-leader/:path*',
        destination: '/garden/topics/genai-leader',
        permanent: true,
      },
      {
        source: '/tag/leadership',
        destination: '/garden/topics/leadership',
        permanent: true,
      },
      {
        source: '/tag/leadership/:path*',
        destination: '/garden/topics/leadership',
        permanent: true,
      },
      {
        source: '/tag/life-and-character',
        destination: '/garden/topics/life-and-character',
        permanent: true,
      },
      {
        source: '/tag/life-and-character/:path*',
        destination: '/garden/topics/life-and-character',
        permanent: true,
      },
      {
        source: '/tag/notion',
        destination: '/garden/topics/notion',
        permanent: true,
      },
      {
        source: '/tag/notion/:path*',
        destination: '/garden/topics/notion',
        permanent: true,
      },
      {
        source: '/tag/productivity',
        destination: '/garden/topics/productivity',
        permanent: true,
      },
      {
        source: '/tag/productivity/:path*',
        destination: '/garden/topics/productivity',
        permanent: true,
      },
      {
        source: '/tag/technology',
        destination: '/garden/topics/technology',
        permanent: true,
      },
      {
        source: '/tag/technology/:path*',
        destination: '/garden/topics/technology',
        permanent: true,
      },
      // Ghost tag redirects - Fallback for any other /tag/<slug>
      {
        source: '/tag/:slug*',
        destination: '/garden',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
