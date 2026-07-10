/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
