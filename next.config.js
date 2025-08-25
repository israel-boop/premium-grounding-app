/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove swcMinify as it's not needed in newer Next.js versions
  images: {
    domains: [],
  },
}

module.exports = nextConfig