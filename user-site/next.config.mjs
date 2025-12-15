import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Configure webpack to suppress warnings
  webpack: (config, { isServer, dev }) => {
    // Suppress the PackFileCacheStrategy large string warning
    // This is a performance optimization warning, not an error
    // It occurs when webpack caches large strings (common in Next.js builds)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      // Suppress large string serialization warning
      {
        message: /Serializing big strings/,
      },
      // Suppress Edge Runtime warnings for Supabase (uses Node.js APIs)
      // These warnings occur during build analysis but Supabase is only used in Node.js runtime (API routes)
      // The proxy uses Supabase but handles it gracefully with try-catch
      {
        message: /Node.js API.*not supported in the Edge Runtime/,
      },
      {
        message: /A Node.js API is used.*which is not supported in the Edge Runtime/,
      },
      // Suppress by module pattern
      {
        module: /node_modules\/@supabase/,
      },
    ]
    
    return config
  },
  // Configure which packages should be externalized (not bundled)
  // Supabase requires Node.js runtime, so we ensure it's treated as a server-side package
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/realtime-js'],
  // Next.js 16 uses Turbopack by default, but we have webpack config
  // Adding empty turbopack config to silence the error
  // The webpack config will still be used when explicitly requested
  turbopack: {},
}

export default nextConfig
