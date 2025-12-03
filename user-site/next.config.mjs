import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Fix workspace root detection
  outputFileTracingRoot: __dirname,
  // Disable problematic dev tools that cause the errors
  experimental: {
    // Add any experimental features here if needed
  },
  // Configure webpack to suppress the large string serialization warning
  webpack: (config, { isServer, dev }) => {
    // Suppress the PackFileCacheStrategy large string warning
    // This is a performance optimization warning, not an error
    // It occurs when webpack caches large strings (common in Next.js builds)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /./,
        message: /Serializing big strings.*PackFileCacheStrategy/,
      },
    ]
    
    return config
  },
}

export default nextConfig
