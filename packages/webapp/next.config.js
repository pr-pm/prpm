/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // TODO: Re-enable after deploying registry with SEO endpoints (/api/v1/search/seo/packages and /api/v1/search/seo/collections)
  // The endpoints exist in code (commit b3e4b54) but need to be deployed to production
  // output: 'export',
  trailingSlash: false, // Changed to false for CloudFront compatibility
  env: {
    NEXT_PUBLIC_REGISTRY_URL: process.env.NEXT_PUBLIC_REGISTRY_URL || process.env.REGISTRY_URL || 'http://localhost:3000',
  },
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
