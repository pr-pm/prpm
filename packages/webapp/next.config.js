/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_REGISTRY_URL: process.env.REGISTRY_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
