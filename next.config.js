/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development practices
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Configure images if you're using next/image
  images: {
    domains: [], // Add any external image domains here if needed
  },
  
  // Configure environment variables that should be available to the browser
  env: {
    // You can add custom env variables here if needed
  },
}

module.exports = nextConfig