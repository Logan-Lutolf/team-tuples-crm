import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
};

module.exports = {
    experimental: {
      serverActions: {
        bodySizeLimit: '3mb',
      },
    },
}


export default nextConfig;
