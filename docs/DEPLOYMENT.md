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

### Neon

- `DATABASE_URL` = pooled connection string
- `DIRECT_URL` = direct (non-pooled) connection for migrations

### Local Docker (dev)

```bash
docker compose up -d
# uses port 5435 by default in this repo
```

## 2. Database

```bash
npx prisma migrate deploy
npm run db:seed
npm run setup:admin
```

`setup:admin` creates the first Super Admin from `INITIAL_ADMIN_*` and refuses if one already exists.

## 3. Build and run

```bash
npm run build
npm run start
# listens on PORT (default 3000)
```

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

## 4. Nginx (HTTPS + HSTS)

Terminate TLS at Nginx; proxy to `127.0.0.1:3000`. Enable HSTS in production. Serve `/uploads` is **not** required — media is delivered via `/media/*` route handler.

## 5. Scheduled jobs

Protect cron routes with `Authorization: Bearer $CRON_SECRET`.

```cron
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://example.com/api/cron/publish-scheduled
*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://example.com/api/cron/newsletter
```

## 6. Uploads

Default `UPLOAD_DIR=./uploads` (gitignored). Back up this directory with the database. For multi-instance hosts, switch `STORAGE_DRIVER=s3` when credentials are ready (stub present).

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
