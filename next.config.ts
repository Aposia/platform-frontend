import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) return []
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
  images: {
    domains: ['iframe.mediadelivery.net', 'vz-cdn.b-cdn.net'],
  },
}

export default nextConfig
