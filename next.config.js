/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'qriiosvdowitaigzvwfo.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'tempfile.aiquickdraw.com',
      },
      {
        protocol: 'https',
        hostname: '**.aiquickdraw.com',
      },
    ],
  },
  // Optimize chunks and prevent timeout
  compress: true,
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    return config
  },
  experimental: {
    // Optimize chunk splitting
    optimizePackageImports: [
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react'
    ],
  },
}

module.exports = nextConfig
