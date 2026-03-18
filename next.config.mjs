/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/admin/clusters", destination: "/worldview/clusters", permanent: false },
      { source: "/admin/missions", destination: "/missions/manage", permanent: false },
    ];
  },
};

export default nextConfig;
