/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/app/profile',
        permanent: true,
      },
    ];
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_ORIGIN: '/',
  },
};

export default nextConfig;
