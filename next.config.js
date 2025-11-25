// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    unoptimized: true, // necesario para export estático
  },

  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false,
      fs: false,
      path: false,
      os: false,
      stream: false,
      util: false,
    };

    return config;
  },
};

module.exports = nextConfig;

