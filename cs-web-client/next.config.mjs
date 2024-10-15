/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        domains: ['storage.googleapis.com'], // Add 'storage.googleapis.com' here
    },
};

export default nextConfig;