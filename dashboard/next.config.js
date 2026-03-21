/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Remover problemas com workbox
    config.externals.push({
      'workbox-webpack-plugin': 'workbox-webpack-plugin',
    });
    return config;
  },
};

module.exports = nextConfig;
