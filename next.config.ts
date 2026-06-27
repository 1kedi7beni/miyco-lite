import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // API ve sayfa yükleme performansı için
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  experimental: {
    // Server Actions için gelişmiş optimizasyonlar
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react', 'leaflet'],
  },
  // Leaflet gibi sadece client-side paketler için
  transpilePackages: ['react-leaflet', 'leaflet'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.basemaps.cartocdn.com' },
      { protocol: 'https', hostname: '**.tile.openstreetmap.org' },
    ],
  },
}

export default nextConfig
