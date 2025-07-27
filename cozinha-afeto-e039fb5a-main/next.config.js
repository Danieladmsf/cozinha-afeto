/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  swcMinify: true,
  experimental: {
    esmExternals: false,
  },
  images: {
    unoptimized: true,
  },
  // Configurações para evitar problemas entre dev e prod
  reactStrictMode: true,
  allowedDevOrigins: ['9000-firebase-studio-1752949503496.cluster-uf6urqn4lned4spwk4xorq6bpo.cloudworkstations.dev'],
  eslint: {
    // Durante builds em produção, não falhar por warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Durante builds em produção, não falhar por erros de tipo
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
