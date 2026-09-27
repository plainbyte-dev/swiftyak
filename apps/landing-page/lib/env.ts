// Backend the app talks to. `next dev` uses the local API; `next build` / `next start`
// (including Vercel) use the deployed one. Set NEXT_PUBLIC_API_URL to override either.
export const DEVELOPMENT_API_URL = 'http://localhost:4000/api';
export const PRODUCTION_API_URL = 'https://swiftyak-admin-backend.vercel.app/api';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : DEVELOPMENT_API_URL);
