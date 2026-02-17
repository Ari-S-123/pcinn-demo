import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "recharts", "xlsx"],
  },
};

export default nextConfig;
