import type { NextConfig } from "next";
import { isV0Sandbox } from "./src/lib/preview-environment";

const nextConfig: NextConfig = {
  env: {
    MOVIETABLE_V0_PREVIEW: String(isV0Sandbox(process.cwd(), {
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    })),
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }, {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-store, max-age=0" },
        { key: "Content-Security-Policy", value: "default-src 'none'; script-src 'self'; connect-src 'self'" },
      ],
    }, {
      source: "/manifest.json",
      headers: [
        { key: "Content-Type", value: "application/manifest+json" },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    }];
  },
};

export default nextConfig;
