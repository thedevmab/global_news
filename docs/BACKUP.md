# Backup and restore

## What to back up

1. **PostgreSQL database** (all content, users, settings)
2. **Uploads directory** (`UPLOAD_DIR`, default `./uploads`)
3. **Environment file** (store securely offline — never in the public repo)

## PostgreSQL (self-hosted / Docker)

```bash
pg_dump -Fc -h localhost -p 5435 -U gvn -d gvn -f gvn-$(date +%F).dump
```

Restore:

```bash
pg_restore -h localhost -p 5435 -U gvn -d gvn --clean --if-exists gvn-YYYY-MM-DD.dump
```

## Neon

- Use Neon **branches** for point-in-time snapshots before risky migrations
- Export with `pg_dump` using the **direct** connection string when needed
- Configure retention in the Neon project console

## Uploads

```bash
tar -czf uploads-$(date +%F).tar.gz -C /var/www/gvn-website uploads
```

Restore by extracting into `UPLOAD_DIR` and fixing ownership (`chown -R www-data:www-data uploads`).

## Verification

After restore:

```bash
npx prisma migrate status
npm run setup:admin   # no-ops if Super Admin exists
npm run build && npm run start
```

Confirm homepage, an article URL, admin login, and a media URL under `/media/...`.

## Schedule

- Daily database dump (retain ≥ 14 days)
- Daily uploads archive (or object-storage versioning when on S3)
- Weekly restore drill on a staging Neon branch
