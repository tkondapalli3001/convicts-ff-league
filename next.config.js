/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '/convicts-ff-league',
  assetPrefix: '/convicts-ff-league',
}

module.exports = nextConfig
