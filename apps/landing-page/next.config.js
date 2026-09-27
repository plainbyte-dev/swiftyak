const isDev = process.env.NODE_ENV === 'development';

// Keep in sync with lib/env.ts — the browser may only call the backend this build uses.
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://swiftyak-admin-backend.vercel.app/api'
    : 'http://localhost:4000/api');
const apiOrigin = new URL(apiUrl).origin;

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://static.rocket.new${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://img.rocket.new https://*.builtwithrocket.new;
  font-src 'self' data:;
  connect-src 'self' ${apiOrigin} https://appanalytics.rocket.new https://*.builtwithrocket.new${isDev ? ' ws://localhost:* ws://127.0.0.1:*' : ''};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
