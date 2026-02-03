import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@clawwork/sdk"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
