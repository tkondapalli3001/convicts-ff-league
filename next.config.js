/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '/convicts-ff-league',
  assetPrefix: '/convicts-ff-league',
  // Each build's worker URLs get a fresh tag, so a deploy never runs last build's worker
  env: { WORKER_VERSION: String(Date.now()) },
}

module.exports = nextConfig
