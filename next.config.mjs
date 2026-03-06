/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling packages that rely on Node.js native modules,
  // WASM binaries, or dynamic require() calls. These must be loaded by the Node.js
  // runtime directly, not inlined by webpack.
  serverExternalPackages: [
    "@react-pdf/renderer",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains for flexibility
      },
    ],
  },
}

export default nextConfig
