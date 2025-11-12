/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: false, // Changed to false for CloudFront compatibility
  env: {
    NEXT_PUBLIC_REGISTRY_URL: process.env.NEXT_PUBLIC_REGISTRY_URL || process.env.REGISTRY_URL || 'http://localhost:3111',
    REGISTRY_URL: process.env.REGISTRY_URL || process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111',
    SSG_DATA_TOKEN: process.env.SSG_DATA_TOKEN,
  },
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
