const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl && process.env.NODE_ENV === 'production') {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Set it in the production environment before building/starting the app.'
  );
}

export const API_BASE = rawApiUrl || 'http://localhost:4000/api';
