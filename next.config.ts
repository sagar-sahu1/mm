import type {NextConfig} from 'next';
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/[^/]+\/quiz\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'quiz-pages',
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/[^/]+\/api\/quiz\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'quiz-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/[^/]+\/(.*)\.(?:js|css|png|jpg|jpeg|svg|gif|ico|webp|woff2?)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { 
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/newv2-68c50.appspot.com/**', 
      },
      { // Added for Google profile pictures
        protocol: 'https',
        hostname: '*.googleusercontent.com', // Covers lh3.googleusercontent.com, etc.
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
  },
};

module.exports = withPWA(nextConfig);
