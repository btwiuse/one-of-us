import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/one-of-us',
  webpack: (config, { isServer }) => {
    // Add raw loader for .idl files
    config.module.rules.push({
      test: /\.idl$/,
      type: 'asset/source',
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        http: false,
        https: false,
        zlib: false,
        assert: require.resolve('assert'),
        os: false,
        path: require.resolve('path-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        util: require.resolve('util'),
        events: require.resolve('events'),
      };
    }
    return config;
  },
};

export default nextConfig;
