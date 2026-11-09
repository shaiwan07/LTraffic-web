import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ltraffic.co.uk",
        pathname: "/employeesarea/admin/employeephoto/**",
      },
      {
        protocol: "https",
        hostname: "ltraffic.co.uk",
        pathname: "/employeesarea/admin/bulletin/**",
      },
      {
        protocol: "https",
        hostname: "ltraffic.co.uk",
        pathname: "/employeesarea/bulletin/**",
      },
    ],
  },
};

export default nextConfig;
