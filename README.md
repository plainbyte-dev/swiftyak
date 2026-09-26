# SwiftYak

Turborepo monorepo managed with bun workspaces.

| App | Path | Dev URL |
| --- | --- | --- |
| Landing page (Next.js, Cloudflare) | `apps/landing-page` | http://localhost:3001 |
| Admin portal (Next.js) | `apps/admin` | http://localhost:3000 |
| Admin API (Express) | `apps/admin-backend` | http://localhost:4000 |

```bash
bun install
bun run dev                                   # all apps
bunx turbo run dev --filter=swiftyak-admin    # a single app
bun run build
bun run lint
```

Each app reads its own env file (`apps/<app>/.env`); see `apps/admin-backend/.env.example`.
The Next.js apps require `NEXT_PUBLIC_API_URL` at build time.

Deploy the landing page with `bun run deploy` from `apps/landing-page`.
