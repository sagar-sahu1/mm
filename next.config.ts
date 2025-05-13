
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { 
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/newv2-68c50.appspot.com/**', 
      },
      { // Added for Google profile pictures
        protocol: 'https',
        hostname: '*.googleusercontent.com', // Covers lh3.googleusercontent.com, etc.
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
