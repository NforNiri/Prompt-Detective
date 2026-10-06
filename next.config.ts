import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const onVercel = Boolean(process.env.VERCEL);
// Vercel injects its comment toolbar (vercel.live) into preview deployments only.
const vercelPreview = process.env.VERCEL_ENV === "preview";
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "";
// The SDK fetches its remote config (JSON, not scripts) from the matching assets host:
// https://eu.i.posthog.com -> https://eu-assets.i.posthog.com
const posthogAssets = posthogHost.replace(/^https:\/\/([a-z]+)\.i\.posthog\.com\/?$/, "https://$1-assets.i.posthog.com");
const posthogOrigins = [...new Set([posthogHost, posthogAssets])].filter(Boolean).join(" ");

/**
 * No nonces: they would need a proxy on every request. 'unsafe-inline' for scripts covers the
 * inline payload Next streams into the HTML; nothing renders user-controlled HTML.
 * Puzzle images go through /_next/image (self); the Supabase host is a fallback for direct URLs.
 * Vercel Analytics loads from the same origin (/_vercel/insights).
 */
function contentSecurityPolicy(): string {
  const live = vercelPreview ? " https://vercel.live" : "";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${live}`,
    `style-src 'self' 'unsafe-inline'${live}`,
    `img-src 'self' data: blob: https://*.supabase.co${vercelPreview ? " https://vercel.live https://vercel.com" : ""}`,
    `font-src 'self'${vercelPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
    `connect-src 'self' ${posthogOrigins}${vercelPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`.trimEnd(),
    `frame-src ${vercelPreview ? "https://vercel.live" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    // Local http (next start, LAN playtests) would break if requests were forced to https.
    ...(onVercel ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  images: {
    // Puzzle images live in the public Supabase bucket "puzzles".
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/puzzles/**" }],
    qualities: [75],
  },
  // Lets a phone on the home network load the dev server (runbook Day 3 acceptance).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
