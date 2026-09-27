// Backend the admin talks to, set per environment in:
//   .env.development → `next dev`               → http://localhost:4000/api
//   .env.production  → `next build` and Vercel  → https://swiftyak-admin-backend.vercel.app/api
// A NEXT_PUBLIC_API_URL set in the shell, .env.local or Vercel's settings overrides these.
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set — check .env.development / .env.production');
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL;
