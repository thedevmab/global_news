# Global Voice Network (GVN)

Professional, production-oriented news and media platform for **Global Voice Network**.

Single Next.js (App Router) application with PostgreSQL (Neon), Prisma, Auth.js, TipTap, and a full editorial CMS.

## Spec source

The uploaded Functional Requirements Document was **not available** in the workspace. This repository treats the project brief as the specification. Derived requirement IDs live in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md). Open decisions are in [`docs/OPEN_DECISIONS.md`](docs/OPEN_DECISIONS.md). Traceability is in [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md).

## Stack

- Next.js App Router + React + TypeScript (strict)
- Tailwind CSS with GVN design tokens
- PostgreSQL (Neon) + Prisma ORM
- Auth.js (Credentials) + argon2 + DB-backed sessions
- TipTap rich text (JSON) + sanitized HTML rendering
- Vitest + Playwright

## Quick start

```bash
cp .env.example .env
# Fill DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_URL, INITIAL_ADMIN_*

npm install
npx prisma migrate deploy
npm run db:seed
npm run setup:admin
npm run dev
```

- Public site: http://localhost:3000
- Admin CMS: http://localhost:3000/admin
- Sign-in: http://localhost:3000/login

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit + integration (Vitest) |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests (needs `DATABASE_URL`) |
| `npm run test:e2e` | Playwright E2E smoke |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:migrate:deploy` | Apply migrations (prod) |
| `npm run db:seed` | Seed categories/settings (`prisma.seed`) |
| `npm run db:studio` | Prisma Studio |
| `npm run setup:admin` | Create first Super Admin from env |

## Brand

Logo: [`public/brand/gvn-logo-navy.jpg`](public/brand/gvn-logo-navy.jpg) (original asset, navy background). A transparent SVG/PNG for light backgrounds is requested — see [`public/brand/README.md`](public/brand/README.md).

Colors: Navy `#10213A`, Deep Navy `#0B1730`, Red `#E63946`, Light Gray `#F3F5F8`, Text `#263449` / `#718096`.

## Documentation

- [Deployment](docs/DEPLOYMENT.md)
- [Backup & restore](docs/BACKUP.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Traceability](docs/TRACEABILITY.md)
- [Open decisions](docs/OPEN_DECISIONS.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)

## Security notes

- Never commit `.env` or secrets.
- No default public admin password ships with the app.
- Admin routes are `noindex` and require authentication.
- Uploads are validated server-side (MIME + magic bytes).

## License

Proprietary — Global Voice Network. All rights reserved.
