import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverComponentsHmrCache: false,
  },
  images: {
    unoptimized: Boolean(process.env.E2E_PRODUCT_API_URL),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prueba-tecnica-api-tienda-moviles.onrender.com',
        port: '',
        pathname: '/images/**',
        search: '',
      },
    ],
  },
}

export default nextConfig
