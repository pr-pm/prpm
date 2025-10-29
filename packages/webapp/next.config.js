/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: false, // Changed to false for CloudFront compatibility
  env: {
    NEXT_PUBLIC_REGISTRY_URL: process.env.NEXT_PUBLIC_REGISTRY_URL || process.env.REGISTRY_URL || 'http://localhost:3111',
  },
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
