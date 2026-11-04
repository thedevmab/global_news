# Open Decisions & Unresolved Items

Recorded when the prompt was ambiguous. Prefer simplest secure maintainable choice.

| ID | Topic | Decision taken | Rationale |
|----|-------|----------------|-----------|
| OD-01 | FRD PDF missing | Treat user prompt as spec; derive IDs | User chose this option |
| OD-02 | Database host | Neon PostgreSQL via `DATABASE_URL` + `DIRECT_URL` | User provided Neon |
| OD-03 | Auth library | Auth.js v5 (NextAuth) Credentials + DB Session validation | Spec requires Auth.js-compatible |
| OD-04 | Password hash | argon2 | Spec allows argon2 or bcrypt; argon2 preferred |
| OD-05 | CAPTCHA | Cloudflare Turnstile | Free, privacy-friendly; bypass in local when keys absent |
| OD-06 | Email | nodemailer SMTP; Mailpit/log in dev | Spec: SMTP or supported API |
| OD-07 | Amharic FTS | `simple` text search config | Postgres has no Amharic stemmer |
| OD-08 | Logo on light bg | Placeholder slot until transparent asset provided | Uploaded logo is navy-backed JPG |
| OD-09 | Urgent publish override | Implemented for Publisher+; always audit-logged | Spec says "if implemented" |
| OD-10 | Newsletter double opt-in | Enabled when `NEWSLETTER_CONFIRMATION_REQUIRED=true` (default true in prod) | Spec: "when enabled" |
| OD-11 | Ad scripts | Sandboxed iframe `srcdoc` only | Untrusted third-party JS |
| OD-12 | Storage | Local `/uploads` + `StorageDriver` interface; S3 stub | Spec initial local, migrate later |
| OD-13 | Locale routing | English default (no prefix); Amharic under `/am/...` | Simple, SEO-friendly |
| OD-14 | Session model | JWT carries opaque `sessionId`; DB row validated each request | Enables immediate revocation |
| OD-15 | Node version | Target Node 20 LTS for production; local may use newer | Next.js production recommendation |
| OD-16 | Cache Components | Disabled in next.config | Conflicts with Date/DB usage in public layouts under Next 16; use revalidatePath/Tag instead |
| OD-17 | Local DB port | Docker Postgres on host port 5435 | 5432–5434 already in use on this machine |
| OD-16 | Cache Components | Disabled in next.config | Conflicts with Date/DB usage in public layouts under Next 16; use revalidatePath/Tag instead |
| OD-17 | Local DB port | Docker Postgres on host port 5435 | 5432–5434 already in use on this machine |

## Phase 2 backlog (deferred)

- Multi-language beyond EN/AM
- Real S3-compatible production storage wiring
- Advanced revision visual diff UI beyond text/JSON compare
- Collaborative realtime content locks (warnings only in v1)
- Push notifications / PWA
- Commenting / user accounts for visitors
- Advanced analytics beyond daily view aggregates + optional GA
