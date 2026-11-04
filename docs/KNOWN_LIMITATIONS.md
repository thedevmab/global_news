# Known Limitations & Phase 2 Backlog

## Known limitations (v1)

1. **Amharic full-text search** uses PostgreSQL `simple` configuration (token matching without stemming).
2. **Live email / Turnstile / GA / S3** require real credentials; integrations are implemented and gated by env vars. Live verification is pending credentials.
3. **Lighthouse / LCP targets** are measured against a local production build; Ethiopian mobile-network verification requires a deployed host.
4. **Logo on light backgrounds**: original asset is a navy-backed JPG. Transparent SVG/PNG requested in `public/brand/README.md`.
5. **Collaborative editing locks** are warning-only (soft), not hard exclusive locks.
6. **Newsletter bulk send** is disabled unless `NEWSLETTER_SENDING_ENABLED=true` (prevents accidental sends in development). Cron `/api/cron/newsletter` is a no-op when the flag is false.
7. **Ad third-party scripts** run only inside a sandboxed iframe; some interactive ad formats may be limited.
8. **FRD PDF** was not attached; requirement IDs are derived from the project brief.
9. **SlugRedirect in proxy** queries the database on matching public content paths; if the DB is unreachable the request continues without redirect.
10. **Turnstile** bypasses verification in development/test when `TURNSTILE_SECRET_KEY` is unset (warning logged). Production requires a real secret.
11. **Next.js Cache Components** disabled (OD-16) due to Date/DB usage in public layouts; use `revalidatePath` / `revalidateTag` after editorial publishes.
12. **Some admin CMS UIs** (homepage drag polish, tag merge UX, full campaign composer) are functional shells on real services — deepen in Phase 2.
13. **Local Docker Postgres** defaults to host port **5435** in this repo.

## Phase 2 backlog

- Wire production S3-compatible storage end-to-end
- Additional UI languages beyond English and Amharic
- Visual side-by-side revision diff UI
- Hard exclusive content locks with presence
- PWA / push notifications
- Visitor comments and accounts
- Advanced analytics dashboards beyond daily aggregates + GA
- Image CDN integration
- Multi-region read replicas
- Re-enable Cache Components with `connection()` / `'use cache'` patterns
- Playwright a11y suite expansion + Lighthouse CI on deployed host
