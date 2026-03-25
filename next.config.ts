/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'humble-space-eureka-jqqwwwx47x9cqjw4-3000.app.github.dev',
        'localhost:3000'
      ],
    },
  },
  // Se avevi cacheComponents: true, assicurati di averlo rimosso o messo a false
};

module.exports = nextConfig;