import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Puzzle images live in the public Supabase bucket "puzzles".
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/puzzles/**" }],
    qualities: [75],
  },
  // Lets a phone on the home network load the dev server (runbook Day 3 acceptance).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
