# GVN Deployment Guide (Linux VPS / managed Node host)

## Requirements

- Node.js **20 LTS** (or newer LTS compatible with Next.js 16)
- PostgreSQL 16+ (Neon recommended for managed Postgres)
- Reverse proxy with TLS (Nginx or Caddy)
- Process manager: systemd or PM2
- Disk for `/uploads` (or configure S3 later)

## 1. Clone and install

```bash
git clone <repo-url> gvn-website && cd gvn-website
npm ci
cp .env.example .env
# Edit .env — set AUTH_SECRET (32+ chars), DATABASE_URL, DIRECT_URL, CRON_SECRET, AUTH_URL, NEXT_PUBLIC_SITE_URL
```

### Neon / Vercel

- `DATABASE_URL` = pooled `-pooler` URL with `connection_limit=5` (serverless-friendly)
- `DIRECT_URL` = direct (non-pooled) connection for migrations
- Media stays in Postgres (`STORAGE_DRIVER=db`) for now; `/media` responses are immutable so a CDN can cache them

### Local Docker (dev)

```bash
docker compose up -d
# uses port 5435 by default in this repo
```

## 2. Database

Run migrations **before** promoting a build that depends on new schema. Use `DIRECT_URL` for migrate deploy against Neon.

```bash
npm run db:migrate:deploy
npm run db:seed
npm run setup:admin
```

`setup:admin` creates the first Super Admin from `INITIAL_ADMIN_*` and refuses if one already exists.

Seeding is **manual only** — never part of `npm run build`. Preview/CI builds must not migrate or seed a shared production database.

If `prisma migrate deploy` fails on the known middle-ad-slot migration, recover with:

```bash
npm run db:migrate:recover
```

## 3. Build and run

`npm run build` is `next build` only. `DATABASE_URL` must be reachable during build so home/about and other prerendered routes can query the database.

```bash
npm run db:migrate:deploy   # before first deploy / when migrations change
npm run build
npm run start
# listens on PORT (default 3000)
```

### Vercel

Set `DATABASE_URL` (pooled), `DIRECT_URL` (non-pooler), `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, and `CRON_SECRET` in project env. Build command can stay `npm run build`. Run `npm run db:migrate:deploy` in CI (or manually) with `DIRECT_URL` **before** promoting a release that includes new migrations.

### systemd example

```ini
[Unit]
Description=GVN Next.js
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/gvn-website
EnvironmentFile=/var/www/gvn-website/.env
ExecStart=/usr/bin/npm run start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

### VPS / PM2

Run **one** `next start` instance (PM2 fork mode, instances: 1). ISR and the Next data cache live on that process’s disk. Multiple instances later need a shared `cacheHandler` (not shipped in this pass).

If Cloudflare (or similar) sits in front: respect origin `Cache-Control`, and bypass caching for `/admin*`, `/api*`, `/preview*`, `/login*`, and any request carrying an `authjs.session-token` cookie.

## 4. Nginx (HTTPS + HSTS)

Terminate TLS at Nginx; proxy to `127.0.0.1:3000`. Enable HSTS in production. Serve `/uploads` is **not** required — media is delivered via `/media/*` route handler.

## 5. Scheduled jobs

Protect cron routes with `Authorization: Bearer $CRON_SECRET`.

```cron
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://example.com/api/cron/publish-scheduled
*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://example.com/api/cron/newsletter
```

## 6. Uploads

**Local / VPS:** `STORAGE_DRIVER=local` and `UPLOAD_DIR=./uploads` (gitignored). Back up this directory with the database.

**Vercel:** local disk is not writable. The app stores uploads in Postgres (`MediaObject`, `STORAGE_DRIVER=db`) automatically — no Vercel Blob or S3 required. Keep image sizes within the 5MB limit.

## 7. Email

Configure SMTP_* variables. Keep `NEWSLETTER_SENDING_ENABLED=false` until ready for bulk mail.

## 8. Rollback

1. Deploy previous release directory / git tag
2. `npm ci && npm run build`
3. If a migration must roll back, restore DB from backup first (Prisma does not auto-down in production)
4. Restart process manager

## 9. Monitoring

- Application logs via systemd/journald or PM2
- Optional `SENTRY_DSN`
- Health: `GET /` and DB connectivity via admin login

## 10. Security checklist

- [ ] Strong `AUTH_SECRET` and `CRON_SECRET`
- [ ] HTTPS only in production
- [ ] No `.env` in git
- [ ] Admin unreachable without auth; `X-Robots-Tag: noindex`
- [ ] Uploads validated server-side
- [ ] Backups scheduled (see BACKUP.md)
