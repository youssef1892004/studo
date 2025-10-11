// File path: next.config.js
/** @type {import('next').NextConfig} */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ffmpegStaticPath = require('ffmpeg-static');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Ensure client chunks resolve from the correct origin/port in dev
  // Use NEXT_PUBLIC_BASE_URL to avoid hardcoded localhost:3000 when dev server chooses another port
  assetPrefix: process.env.NEXT_PUBLIC_BASE_URL || '',
  eslint: {
    // Ignore ESLint during production build to avoid blocking on config mismatches
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allow audio/media from blob and trusted cloud storage (Wasabi/AWS S3)
            value: "media-src 'self' blob: https://voicestudio.s3.eu-south-1.wasabisys.com https://*.wasabisys.com https://*.amazonaws.com;",
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // We only need ffmpeg for merging on the server
    if (isServer) {
      

      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: ffmpegStaticPath,
              to: path.join(__dirname, '.next/server/vendor-chunks/'),
            },
          ],
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;