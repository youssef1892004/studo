// File path: next.config.js
/** @type {import('next').NextConfig} */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ffmpegStaticPath = require('ffmpeg-static');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
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
