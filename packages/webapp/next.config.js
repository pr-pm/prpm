/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true, // Required for S3 static hosting
  env: {
    NEXT_PUBLIC_REGISTRY_URL: process.env.REGISTRY_URL || 'http://localhost:3000',
  },
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
