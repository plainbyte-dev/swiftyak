import type { NextConfig } from "next";
import { API_BASE } from "./lib/env";

const isDev = process.env.NODE_ENV === "development";

// The browser may only send requests to the backend this build is configured for.
const apiOrigin = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' ${apiOrigin};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: cspHeader.replace(/\s{2,}/g, " ").trim() },
        ],
      },
    ];
  },
};

export default nextConfig;
