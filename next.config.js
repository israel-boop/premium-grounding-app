/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  eslint: {
    // This will ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig