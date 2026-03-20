/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
