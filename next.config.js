/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, 
  },

  experimental: {
    turbo: false,
  },

  webpack: (config) => {
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
