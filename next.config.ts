import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yiwrceiyoggwfnjiikag.supabase.co" },
    ],
  },
};

export default nextConfig;
